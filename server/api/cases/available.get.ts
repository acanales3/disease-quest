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
      .select("id, name, description, created_at")
      .order("created_at", { ascending: false });

    if (error) throw createError({ statusCode: 500, message: error.message });
    return data ?? [];
  }

  if (role === "STUDENT") {
    const { data: memberships, error: mErr } = await client
      .from("classroom_students")
      .select("classroom_id")
      .eq("student_id", userId);

    if (mErr) throw createError({ statusCode: 500, message: mErr.message });

    const classroomIds = (memberships ?? []).map((m: any) => m.classroom_id);
    if (classroomIds.length === 0) return [];

    const { data: rows, error: ccErr } = await client
      .from("classroom_cases")
      .select("classroom_id, case_id, cases(id, name, description, created_at)")
      .in("classroom_id", classroomIds);

    if (ccErr) throw createError({ statusCode: 500, message: ccErr.message });

    const flatCases = (rows ?? [])
      .map((r: any) => {
        const caseData = Array.isArray(r.cases) ? r.cases[0] : r.cases;
        if (!caseData) return null;
        return {
          id: `${r.case_id}-${r.classroom_id}`,
          case_id: r.case_id,
          name: caseData.name,
          description: caseData.description,
          created_at: caseData.created_at,
          classroom: r.classroom_id,
        };
      })
      .filter(Boolean);

    if (flatCases.length === 0) return [];

    const caseIds = [...new Set(flatCases.map((c: any) => c.case_id))];

    const { data: progress, error: pErr } = await client
      .from("case_sessions")
      .select("case_id, status, started_at, completed_at")
      .eq("user_id", userId)
      .in("case_id", caseIds);

    if (pErr) throw createError({ statusCode: 500, message: pErr.message });

    const rank: Record<string, number> = {
      completed: 3,
      in_progress: 2,
      created: 1,
      abandoned: 0,
    };

    const progressByCase = new Map<
      number,
      { status: string; started_at: any; completed_at: any }
    >();
    for (const p of progress ?? []) {
      const prev = progressByCase.get((p as any).case_id);
      if (
        (rank[(p as any).status] ?? 0) > (prev ? (rank[prev.status] ?? 0) : -1)
      ) {
        progressByCase.set((p as any).case_id, {
          status: (p as any).status,
          started_at: (p as any).started_at,
          completed_at: (p as any).completed_at,
        });
      }
    }

    const result = (flatCases as any[]).map((c) => {
      const prog = progressByCase.get(c.case_id);
      let status: "not started" | "in progress" | "completed" = "not started";
      if (prog?.status === "completed") status = "completed";
      else if (prog?.status === "in_progress" || prog?.status === "created")
        status = "in progress";
      return { ...c, status, completionDate: prog?.completed_at ?? null };
    });

    return result.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  return [];
});
