import {
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from "#supabase/server";
import type { Database } from "~/assets/types/supabase";

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole<Database>(event);
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  // @ts-ignore
  const userId = user.id || user.sub;

  // 1. Get User Role
  const { data: userData, error: userError } = await client
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (userError || !userData) {
    throw createError({
      statusCode: 403,
      statusMessage: "User role not found",
    });
  }

  const role = userData.role;

  // 2. Determine allowed classrooms
  let allowedClassroomIds: number[] = [];

  if (role === "INSTRUCTOR") {
    const { data: classrooms } = await client
      .from("classrooms")
      .select("id")
      .eq("instructor_id", userId);
    if (classrooms) allowedClassroomIds = classrooms.map((c) => c.id);
  } else if (role === "STUDENT") {
    const { data: enrollments } = await client
      .from("classroom_students")
      .select("classroom_id")
      .eq("student_id", userId);
    if (enrollments)
      allowedClassroomIds = enrollments.map((e) => e.classroom_id);
  }

  // 3. Fetch evaluations joined to case_sessions (for attempt_number + completed_at)
  //    and to cases → classroom_cases → classrooms (for classroom context).
  //
  //    Each row = one evaluation = one attempt.
  //    We JOIN case_sessions so we get attempt_number and completed_at.
  //    session_id can be null (legacy rows without a session) — those get
  //    attempt_number = 1 and completed_at = evaluation.created_at as fallback.
  let dbQuery = client.from("evaluations").select(`
    id,
    user_id,
    session_id,
    history_taking_synthesis,
    physical_exam_interpretation,
    differential_diagnosis_formulation,
    diagnostic_tests,
    management_reasoning,
    communication_empathy,
    reflection_metacognition,
    created_at,
    case_sessions (
      attempt_number,
      completed_at,
      classroom_id
    ),
    cases!inner (
      id,
      name,
      classroom_cases!inner (
        classroom_id,
        classrooms!inner (
          id,
          name
        )
      )
    )
  `);

  // Role-based filters
  if (role === "STUDENT") {
    dbQuery = dbQuery.eq("user_id", userId);
    if (allowedClassroomIds.length > 0) {
      dbQuery = dbQuery.in(
        "cases.classroom_cases.classroom_id",
        allowedClassroomIds,
      );
    } else {
      return [];
    }
  } else if (role === "INSTRUCTOR") {
    if (allowedClassroomIds.length > 0) {
      dbQuery = dbQuery.in(
        "cases.classroom_cases.classroom_id",
        allowedClassroomIds,
      );
    } else {
      return [];
    }
  } else if (role !== "ADMIN") {
    return [];
  }

  // Order by completed_at ascending so attempt history is chronological
  dbQuery = dbQuery.order("created_at", { ascending: true });

  const { data, error } = await dbQuery;

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  const evaluationRows = (data ?? []) as any[];
  if (evaluationRows.length === 0) return [];

  // 4. Verify active classroom membership (same logic as before)
  const relevantStudentIds = Array.from(
    new Set(
      evaluationRows
        .map((row) => row.user_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );

  const relevantClassroomIds = Array.from(
    new Set(
      evaluationRows.flatMap((row) =>
        Array.isArray(row.cases?.classroom_cases)
          ? row.cases.classroom_cases
              .map((cc: any) => cc?.classroom_id)
              .filter((id: unknown): id is number => typeof id === "number")
          : [],
      ),
    ),
  );

  if (relevantStudentIds.length === 0 || relevantClassroomIds.length === 0)
    return [];

  const { data: memberships } = await client
    .from("classroom_students")
    .select("classroom_id, student_id")
    .in("student_id", relevantStudentIds)
    .in("classroom_id", relevantClassroomIds);

  const activeMemberships = new Set(
    (memberships ?? []).map((m) => `${m.classroom_id}:${m.student_id}`),
  );

  // 5. Build one result row per evaluation (per attempt) per classroom the
  //    case belongs to, filtering by active membership.
  const results: object[] = [];

  for (const row of evaluationRows) {
    if (typeof row.user_id !== "string" || row.user_id.length === 0) continue;

    const caseData = row.cases;
    if (!caseData?.classroom_cases) continue;

    // The session may carry a specific classroom_id (the room the student was
    // in when they played). If available, use that; otherwise fan-out across
    // all classrooms the case belongs to (legacy behaviour).
    const sessionClassroomId: number | null =
      row.case_sessions?.classroom_id ?? null;

    const classroomCases: any[] = Array.isArray(caseData.classroom_cases)
      ? caseData.classroom_cases
      : [];

    for (const cc of classroomCases) {
      const cls = cc.classrooms;
      if (!cls) continue;

      const classroomId: number =
        typeof cc.classroom_id === "number" ? cc.classroom_id : cls.id;

      // If we know the session's classroom, only emit for that one
      if (sessionClassroomId !== null && classroomId !== sessionClassroomId)
        continue;

      if (role !== "ADMIN" && !allowedClassroomIds.includes(classroomId))
        continue;
      if (!activeMemberships.has(`${classroomId}:${row.user_id}`)) continue;

      // Attempt number: prefer case_sessions.attempt_number; fallback to 1
      const attemptNumber: number = row.case_sessions?.attempt_number ?? 1;

      // Completed at: prefer case_sessions.completed_at; fallback to evaluation.created_at
      const completedAt: string | null =
        row.case_sessions?.completed_at ?? row.created_at ?? null;

      // Scores stored as 0.0–1.0 decimals → multiply × 100 for display
      const toPercent = (v: unknown) =>
        typeof v === "number" ? Math.round(v * 100) : 0;

      results.push({
        evaluationId: row.id,
        sessionId: row.session_id ?? null,
        caseId: caseData.id,
        caseName: caseData.name,
        classroomId,
        classroomName: cls.name,
        attemptNumber,
        completedAt,
        count: 1,
        history_taking_synthesis: toPercent(row.history_taking_synthesis),
        physical_exam_interpretation: toPercent(
          row.physical_exam_interpretation,
        ),
        differential_diagnosis_formulation: toPercent(
          row.differential_diagnosis_formulation,
        ),
        diagnostic_tests: toPercent(row.diagnostic_tests),
        management_reasoning: toPercent(row.management_reasoning),
        communication_empathy: toPercent(row.communication_empathy),
        reflection_metacognition: toPercent(row.reflection_metacognition),
      });
    }
  }

  // Sort: classroom → case → attempt (chronological)
  results.sort((a: any, b: any) => {
    if (a.classroomName !== b.classroomName)
      return a.classroomName.localeCompare(b.classroomName);
    if (a.caseName !== b.caseName) return a.caseName.localeCompare(b.caseName);
    // Chronological within same case
    if (a.completedAt && b.completedAt)
      return (
        new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
      );
    return a.attemptNumber - b.attemptNumber;
  });

  return results;
});
