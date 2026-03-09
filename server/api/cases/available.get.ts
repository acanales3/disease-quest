import { defineEventHandler, createError } from "h3";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);

  const userId = (user as any)?.id || (user as any)?.sub;

  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const { data: userProfile, error: profileError } = (await client
    .from("users")
    .select("role")
    .eq("id", userId)
    .single()) as { data: { role: string } | null; error: any };

  if (profileError || !userProfile) {
    throw createError({
      statusCode: 403,
      message: "Forbidden: User profile not found",
    });
  }

  const role = userProfile.role?.toUpperCase();

  if (role === "ADMIN" || role === "INSTRUCTOR") {
    const { data, error } = await client
      .from("cases")
      .select(
        "id, name, description, created_at, classroom_cases(classrooms(id, name, instructor_id))",
      )
      .order("created_at", { ascending: false });

    if (error) throw createError({ statusCode: 500, message: error.message });

    const mappedCases = (data ?? []).map((c: any) => {
      let classrooms = (c.classroom_cases || [])
        .map((cc: any) => cc.classrooms)
        .filter(Boolean);

      if (role === "INSTRUCTOR") {
        classrooms = classrooms.filter(
          (cls: any) => cls.instructor_id === userId,
        );
      }

      classrooms = classrooms.map((cls: any) => ({
        id: cls.id,
        name: cls.name,
      }));

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        created_at: c.created_at,
        classrooms,
      };
    });

    if (mappedCases.length === 0) return [];

    const caseIds = mappedCases.map((c: any) => c.id);

    // Admins/instructors: progress is per case only (no classroom context)
    const { data: sessions, error: sErr } = await client
      .from("case_sessions")
      .select("case_id, status, attempt_number, completed_at")
      .eq("user_id", userId)
      .in("case_id", caseIds)
      .order("attempt_number", { ascending: false });

    if (sErr) throw createError({ statusCode: 500, message: sErr.message });

    const latestSessionByCase = new Map<
      number,
      { status: string; completed_at: string | null }
    >();

    for (const s of sessions ?? []) {
      if (!latestSessionByCase.has(s.case_id)) {
        latestSessionByCase.set(s.case_id, {
          status: s.status,
          completed_at: s.completed_at,
        });
      }
    }

    return mappedCases.map((c: any) => {
      const session = latestSessionByCase.get(c.id);
      let uiStatus: "not started" | "in progress" | "completed" = "not started";

      if (session) {
        if (session.status === "completed") {
          uiStatus = "completed";
        } else if (session.status === "in_progress") {
          uiStatus = "in progress";
        } else {
          uiStatus = "not started";
        }
      }

      return {
        ...c,
        status: uiStatus,
        completionDate: session?.completed_at ?? null,
      };
    });
  }

  if (role === "STUDENT") {
    const { data: memberships, error: mErr } = await client
      .from("classroom_students")
      .select("classroom_id, classrooms(name)")
      .eq("student_id", userId);

    if (mErr) throw createError({ statusCode: 500, message: mErr.message });

    const classroomNames: Record<number, string> = {};
    const classroomIds = (memberships ?? []).map((m: any) => {
      const name = Array.isArray(m.classrooms)
        ? m.classrooms[0]?.name
        : m.classrooms?.name;
      if (name) classroomNames[m.classroom_id] = name;
      return m.classroom_id;
    });

    if (classroomIds.length === 0) return [];

    const { data: rows, error: ccErr } = await client
      .from("classroom_cases")
      .select("classroom_id, case_id, cases(id, name, description, created_at)")
      .in("classroom_id", classroomIds);

    if (ccErr) throw createError({ statusCode: 500, message: ccErr.message });

    // One entry per (case_id, classroom_id) pair — no deduplication.
    // This allows separate progress tracking per classroom even for the same case.
    const entries: {
      case_id: number;
      classroom_id: number;
      name: string;
      description: string;
      created_at: string;
      classroom: { id: number; name: string };
    }[] = [];

    for (const r of rows ?? []) {
      const caseData = Array.isArray(r.cases) ? r.cases[0] : r.cases;
      if (!caseData) continue;

      entries.push({
        case_id: r.case_id,
        classroom_id: r.classroom_id,
        name: caseData.name,
        description: caseData.description,
        created_at: caseData.created_at,
        classroom: {
          id: r.classroom_id,
          name: classroomNames[r.classroom_id] ?? `Classroom ${r.classroom_id}`,
        },
      });
    }

    if (entries.length === 0) return [];

    const caseIds = [...new Set(entries.map((e) => e.case_id))];

    // Fetch sessions including classroom_id so we can match per (case, classroom)
    const { data: sessions, error: sErr } = await client
      .from("case_sessions")
      .select("id, case_id, classroom_id, status, attempt_number, started_at, completed_at")
      .eq("user_id", userId)
      .in("case_id", caseIds)
      .order("attempt_number", { ascending: false });

    if (sErr) throw createError({ statusCode: 500, message: sErr.message });

    // Key: `${case_id}:${classroom_id}` → most recent session for that pair
    const latestSessionByPair = new Map<
      string,
      {
        sessionId: string;
        status: string;
        started_at: string | null;
        completed_at: string | null;
      }
    >();

    for (const s of sessions ?? []) {
      const key = `${s.case_id}:${s.classroom_id}`;
      if (!latestSessionByPair.has(key)) {
        latestSessionByPair.set(key, {
          sessionId: s.id,
          status: s.status,
          started_at: s.started_at,
          completed_at: s.completed_at,
        });
      }
    }

    const result = entries.map((e) => {
      const key = `${e.case_id}:${e.classroom_id}`;
      const session = latestSessionByPair.get(key);

      let uiStatus: "not started" | "in progress" | "completed" = "not started";

      if (session) {
        if (session.status === "completed") {
          uiStatus = "completed";
        } else if (session.status === "in_progress") {
          uiStatus = "in progress";
        } else {
          // 'created' or 'abandoned' → not started
          uiStatus = "not started";
        }
      }

      return {
        // Unique key for the UI to distinguish same case in different classrooms
        id: e.case_id,
        classroom_id: e.classroom_id,
        name: e.name,
        description: e.description,
        created_at: e.created_at,
        classrooms: [e.classroom],
        status: uiStatus,
        completionDate: session?.completed_at ?? null,
        sessionId: session?.sessionId ?? null,
      };
    });

    return result.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  return [];
});