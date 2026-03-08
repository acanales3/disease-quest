// *************
// api/leaderboard.get.ts
// **************
import {
  serverSupabaseUser,
  serverSupabaseServiceRole,
} from "#supabase/server";
import type { Database } from "~/assets/types/supabase";
import type {
  LeaderboardEntry,
  CaseAttemptDetail,
} from "~/assets/interface/Leaderboard";

export default defineEventHandler(
  async (event): Promise<LeaderboardEntry[]> => {
    const client = serverSupabaseServiceRole<Database>(event);
    const user = await serverSupabaseUser(event);

    if (!user)
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    // @ts-ignore
    const userId = user.id || user.sub;

    const { data: userData } = await client
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    const userRole = userData?.role;
    const isAdmin = userRole === "ADMIN";
    const isInstructor = userRole === "INSTRUCTOR";
    const isStudent = userRole === "STUDENT";

    const query = getQuery(event);
    const classroomId = query.classroomId
      ? Number(query.classroomId)
      : undefined;

    // ── 1. Determine which classrooms are visible to this user ───
    let allowedClassroomIds: number[] = [];

    if (isInstructor) {
      const { data: classrooms } = await client
        .from("classrooms")
        .select("id")
        .eq("instructor_id", userId);
      if (classrooms) allowedClassroomIds = classrooms.map((c) => c.id);
    } else if (isStudent) {
      const { data: classrooms } = await client
        .from("classroom_students")
        .select("classroom_id")
        .eq("student_id", userId);
      if (classrooms)
        allowedClassroomIds = classrooms.map((c) => c.classroom_id);
    }

    if (!isAdmin && allowedClassroomIds.length === 0) return [];

    // Narrow further if a specific classroom was requested
    const scopedClassroomIds: number[] =
      classroomId && classroomId !== -1
        ? [classroomId]
        : isAdmin
          ? [] // empty = no classroom filter for admin
          : allowedClassroomIds;

    // ── 2. Fetch all students visible in those classrooms ────────
    // We pull from classroom_students so we respect enrollment,
    // then join to students (for nickname) and users (for admin name).
    let enrollmentQuery = client.from("classroom_students").select(`
        student_id,
        classroom_id,
        classrooms!inner(id, name),
        students!inner(
          nickname,
          users(first_name, last_name)
        )
      `);

    if (scopedClassroomIds.length > 0) {
      enrollmentQuery = enrollmentQuery.in("classroom_id", scopedClassroomIds);
    } else if (!isAdmin) {
      enrollmentQuery = enrollmentQuery.in("classroom_id", allowedClassroomIds);
    }

    const { data: enrollments, error: enrollError } = await enrollmentQuery;

    if (enrollError)
      throw createError({
        statusCode: 500,
        statusMessage: enrollError.message,
      });
    if (!enrollments?.length) return [];

    // Build student info map: studentId → { nickname, fullName, classroomId, classroomName }
    // A student can appear in multiple classrooms — track per (studentId, classroomId)
    type StudentClassroomKey = string; // `${studentId}:${classroomId}`
    const studentInfoMap = new Map<
      StudentClassroomKey,
      {
        studentId: string;
        classroomId: number;
        classroomName: string;
        nickname: string;
        fullName: string;
      }
    >();

    for (const row of enrollments as any[]) {
      const sId = row.student_id as string;
      const cId = row.classroom_id as number;
      const key: StudentClassroomKey = `${sId}:${cId}`;
      if (studentInfoMap.has(key)) continue;

      const u = row.students?.users;
      const fullName = u
        ? [u.first_name, u.last_name].filter(Boolean).join(" ") || "Unknown"
        : "Unknown";

      studentInfoMap.set(key, {
        studentId: sId,
        classroomId: cId,
        classroomName: row.classrooms?.name ?? "Unknown",
        nickname: row.students?.nickname ?? "Anonymous",
        fullName,
      });
    }

    const allStudentIds = Array.from(
      new Set([...studentInfoMap.values()].map((v) => v.studentId)),
    );

    // ── 3. Fetch completed case_sessions for those students ──────
    // IMPORTANT: We do NOT filter by classroom_id here because many sessions
    // are saved with classroom_id = NULL (orchestrator didn't set it, or legacy
    // data). We fetch all completed sessions for the student and then assign
    // them to classrooms via enrollment in step 5.
    const { data: sessions, error: sessionsError } = await client
      .from("case_sessions")
      .select(
        `
        id,
        user_id,
        case_id,
        classroom_id,
        completed_at,
        cases(id, name)
      `,
      )
      .eq("status", "completed")
      .in("user_id", allStudentIds);

    if (sessionsError)
      throw createError({
        statusCode: 500,
        statusMessage: sessionsError.message,
      });

    // ── 4. Fetch evaluations for those sessions ──────────────────
    const sessionIds = (sessions ?? []).map((s: any) => s.id as string);

    const SCORE_FIELDS = [
      "history_taking_synthesis",
      "physical_exam_interpretation",
      "differential_diagnosis_formulation",
      "diagnostic_tests",
      "management_reasoning",
      "communication_empathy",
      "reflection_metacognition",
    ] as const;

    let evalScoreMap = new Map<string, number>(); // sessionId → average score (0–1)

    if (sessionIds.length > 0) {
      const { data: evals } = await client
        .from("evaluations")
        .select(`session_id, ${SCORE_FIELDS.join(", ")}`)
        .in("session_id", sessionIds);

      for (const ev of (evals ?? []) as any[]) {
        if (!ev.session_id) continue;
        const values = SCORE_FIELDS.map((f) => ev[f]).filter(
          (v): v is number => typeof v === "number",
        );
        if (values.length === 0) continue;
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        evalScoreMap.set(ev.session_id, avg);
      }
    }

    // ── 5. Aggregate per (studentId, classroomId) ────────────────
    type AggKey = string; // `${studentId}:${classroomId}`
    const agg = new Map<
      AggKey,
      {
        distinctCases: Map<number, { caseName: string; attempts: number }>;
        scoreSum: number;
        scoreCount: number;
      }
    >();

    // Initialise every enrolled student with zero stats
    for (const key of studentInfoMap.keys()) {
      agg.set(key, {
        distinctCases: new Map(),
        scoreSum: 0,
        scoreCount: 0,
      });
    }

    // Build a reverse map: studentId → all classroomIds they're enrolled in (within scope)
    const studentClassroomsMap = new Map<string, number[]>();
    for (const info of studentInfoMap.values()) {
      if (!studentClassroomsMap.has(info.studentId)) {
        studentClassroomsMap.set(info.studentId, []);
      }
      studentClassroomsMap.get(info.studentId)!.push(info.classroomId);
    }

    for (const session of (sessions ?? []) as any[]) {
      const sId = session.user_id as string;
      const sessionClassroomId = session.classroom_id as number | null;
      const caseId = session.case_id as number;
      const caseName = (session.cases?.name ?? `Case ${caseId}`) as string;
      const score = evalScoreMap.get(session.id as string);

      const enrolledClassrooms = studentClassroomsMap.get(sId) ?? [];

      // Coerce to number — Supabase can return bigint columns as strings
      const sessionCid =
        sessionClassroomId != null ? Number(sessionClassroomId) : null;

      // Which agg buckets should this session count towards?
      // If classroom_id is set and matches an enrollment → just that classroom.
      // If classroom_id is NULL → broadcast to ALL enrolled classrooms (legacy data).
      // If classroom_id is set but not in enrollments → skip.
      let targetClassroomIds: number[];
      if (sessionCid != null) {
        if (enrolledClassrooms.includes(sessionCid)) {
          targetClassroomIds = [sessionCid];
        } else {
          continue;
        }
      } else {
        targetClassroomIds = enrolledClassrooms;
      }

      for (const cId of targetClassroomIds) {
        const key: AggKey = `${sId}:${cId}`;
        const entry = agg.get(key);
        if (!entry) continue;

        if (!entry.distinctCases.has(caseId)) {
          entry.distinctCases.set(caseId, { caseName, attempts: 0 });
        }
        entry.distinctCases.get(caseId)!.attempts++;

        if (score !== undefined) {
          entry.scoreSum += score;
          entry.scoreCount++;
        }
      }
    }

    // ── 6. Build leaderboard entries ─────────────────────────────
    const entries: LeaderboardEntry[] = [];

    for (const [key, aggEntry] of agg) {
      const info = studentInfoMap.get(key);
      if (!info) continue;

      const caseDetails: CaseAttemptDetail[] = Array.from(
        aggEntry.distinctCases.entries(),
      ).map(([caseId, d]) => ({
        caseId,
        caseName: d.caseName,
        attempts: d.attempts,
      }));

      const casesCompleted = aggEntry.distinctCases.size;
      const attemptsCompleted = caseDetails.reduce((s, d) => s + d.attempts, 0);
      const averageScore =
        aggEntry.scoreCount > 0
          ? (aggEntry.scoreSum / aggEntry.scoreCount) * 100
          : 0;

      entries.push({
        id: info.classroomId,
        studentId: info.studentId,
        classroomName: info.classroomName,
        nickname: info.nickname,
        studentName: isAdmin ? info.fullName : undefined,
        casesCompleted,
        attemptsCompleted,
        averageScore: Math.round(averageScore * 100) / 100,
        rank: 0, // assigned below
        caseDetails,
      } as any);
    }

    // ── 7. Sort: cases desc → avg score desc → name asc ─────────
    entries.sort((a, b) => {
      if (a.casesCompleted !== b.casesCompleted)
        return b.casesCompleted - a.casesCompleted;
      if (a.averageScore !== b.averageScore)
        return b.averageScore - a.averageScore;
      const nameA = (a as any).studentName ?? a.nickname ?? "";
      const nameB = (b as any).studentName ?? b.nickname ?? "";
      return nameA.localeCompare(nameB);
    });

    entries.forEach((e, i) => {
      (e as any).rank = i + 1;
    });

    return entries;
  },
);
