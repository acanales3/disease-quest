import { defineEventHandler, createError } from "h3";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);

  // @ts-ignore
  const userId = user?.id || user?.sub;

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

  // ── ADMIN / INSTRUCTOR: all cases ───────────────────────────────────────
  if (role === "ADMIN" || role === "INSTRUCTOR") {
    const { data, error } = await client
      .from("cases")
      .select("id, name, description, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw createError({ statusCode: 500, message: error.message });
    }

    return data ?? [];
  }

  // ── STUDENT ─────────────────────────────────────────────────────────────
  if (role === "STUDENT") {
    // 1) Classrooms this student is enrolled in
    //    Table: classroom_students, column: student_id (FK → students.user_id)
    const { data: memberships, error: mErr } = await client
      .from("classroom_students")
      .select("classroom_id")
      .eq("student_id", userId);

    if (mErr) {
      throw createError({ statusCode: 500, message: mErr.message });
    }

    const classroomIds = (memberships ?? []).map((m: any) => m.classroom_id);
    if (classroomIds.length === 0) return [];

    // 2) Cases assigned to those classrooms
    const { data: rows, error: ccErr } = await client
      .from("classroom_cases")
      .select(
        `
        classroom_id,
        case_id,
        cases (
          id, name, description, created_at
        )
      `,
      )
      .in("classroom_id", classroomIds);

    if (ccErr) {
      throw createError({ statusCode: 500, message: ccErr.message });
    }

    // Flatten + dedupe by case id
    const byCaseId = new Map<number, any>();
    for (const r of rows ?? []) {
      const c = (r as any).cases;
      if (!c) continue;
      const caseId = c.id as number;
      if (!byCaseId.has(caseId)) {
        byCaseId.set(caseId, {
          id: c.id,
          name: c.name,
          description: c.description,
          created_at: c.created_at,
          classroom: (r as any).classroom_id,
        });
      }
    }

    const caseIds = Array.from(byCaseId.keys());
    if (caseIds.length === 0) return [];

    // 3) Progress from case_sessions (user_id FK → auth.users)
    //    Pull all sessions for this user across these cases.
    //    Pick the best status per case so replay works correctly:
    //    a completed past session keeps showing "completed" while
    //    a new in-progress replay is underway.
    const { data: sessions, error: sErr } = await client
      .from("case_sessions")
      .select("case_id, status, started_at, completed_at")
      .eq("user_id", userId)
      .in("case_id", caseIds)
      .order("created_at", { ascending: false });

    if (sErr) {
      throw createError({ statusCode: 500, message: sErr.message });
    }

    const statusPriority: Record<string, number> = {
      completed: 3,
      in_progress: 2,
      created: 1,
    };

    const progressByCase = new Map<
      number,
      {
        status: string;
        started_at: string | null;
        completed_at: string | null;
      }
    >();

    for (const s of sessions ?? []) {
      const caseId = (s as any).case_id as number;
      const existing = progressByCase.get(caseId);
      const incoming = statusPriority[(s as any).status] ?? 0;
      const current = existing ? (statusPriority[existing.status] ?? 0) : -1;

      if (incoming > current) {
        progressByCase.set(caseId, {
          status: (s as any).status,
          started_at: (s as any).started_at,
          completed_at: (s as any).completed_at,
        });
      }
    }

    // 4) Shape for the datatable columns
    const result = caseIds.map((id) => {
      const base = byCaseId.get(id);
      const prog = progressByCase.get(id);

      let status: "not started" | "in progress" | "completed" = "not started";
      if (prog?.status === "completed") status = "completed";
      else if (prog?.status === "in_progress" || prog?.status === "created")
        status = "in progress";

      return {
        ...base,
        status,
        completionDate: prog?.completed_at ?? null,
      };
    });

    result.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return result;
  }

  return [];
});
