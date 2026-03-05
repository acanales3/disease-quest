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

    return (data ?? []).map((c: any) => {
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

    // Deduplicate: one entry per unique case_id, collecting all classrooms
    const caseMap = new Map<
      number,
      {
        case_id: number;
        name: string;
        description: string;
        created_at: string;
        classrooms: { id: number; name: string }[];
      }
    >();

    for (const r of rows ?? []) {
      const caseData = Array.isArray(r.cases) ? r.cases[0] : r.cases;
      if (!caseData) continue;

      const existing = caseMap.get(r.case_id);
      const classroom = {
        id: r.classroom_id,
        name: classroomNames[r.classroom_id] ?? `Classroom ${r.classroom_id}`,
      };

      if (existing) {
        // Add classroom if not already present
        if (!existing.classrooms.some((c) => c.id === classroom.id)) {
          existing.classrooms.push(classroom);
        }
      } else {
        caseMap.set(r.case_id, {
          case_id: r.case_id,
          name: caseData.name,
          description: caseData.description,
          created_at: caseData.created_at,
          classrooms: [classroom],
        });
      }
    }

    if (caseMap.size === 0) return [];

    const caseIds = [...caseMap.keys()];

    // Fetch ALL sessions for this student across these cases, ordered by
    // attempt_number desc so the most recent attempt comes first per case.
    const { data: sessions, error: sErr } = await client
      .from("case_sessions")
      .select("id, case_id, status, attempt_number, started_at, completed_at")
      .eq("user_id", userId)
      .in("case_id", caseIds)
      .order("attempt_number", { ascending: false });

    if (sErr) throw createError({ statusCode: 500, message: sErr.message });

    // For each case, pick the most recent session (highest attempt_number)
    // and map its status to the UI status.
    const latestSessionByCase = new Map<
      number,
      {
        sessionId: string;
        status: string;
        started_at: string | null;
        completed_at: string | null;
      }
    >();

    for (const s of sessions ?? []) {
      if (!latestSessionByCase.has(s.case_id)) {
        // First one we see is the most recent (ordered desc)
        latestSessionByCase.set(s.case_id, {
          sessionId: s.id,
          status: s.status,
          started_at: s.started_at,
          completed_at: s.completed_at,
        });
      }
    }

    const result = [...caseMap.values()].map((c) => {
      const session = latestSessionByCase.get(c.case_id);

      // Map DB session status → UI status
      // DB statuses: 'created' | 'in_progress' | 'completed' | 'abandoned'
      // UI statuses: 'not started' | 'in progress' | 'completed'
      let uiStatus: "not started" | "in progress" | "completed" = "not started";

      if (session) {
        if (session.status === "completed") {
          uiStatus = "completed";
        } else if (session.status === "in_progress") {
          uiStatus = "in progress";
        } else {
          // 'created' or 'abandoned' both map to 'not started'
          uiStatus = "not started";
        }
      }

      return {
        // Use the real case_id (number) so the dropdown can pass it to
        // /api/sessions/active?caseId=... correctly
        id: c.case_id,
        name: c.name,
        description: c.description,
        created_at: c.created_at,
        classrooms: c.classrooms,
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
