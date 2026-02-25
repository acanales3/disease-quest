/**
 * GET /api/sessions/active?caseId=52
 * Returns the most recent non-completed session for this user + case.
 */
import { defineEventHandler, createError, getQuery } from "h3";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);
  // @ts-ignore
  const userId = user?.id || user?.sub;

  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const query = getQuery(event);
  const caseId = query.caseId;

  if (!caseId) {
    throw createError({ statusCode: 400, message: "caseId query param is required" });
  }

  const { data, error } = (await client
    .from("case_sessions")
    .select("id, status, phase, elapsed_minutes, created_at")
    .eq("student_id", userId)
    .eq("case_id", parseInt(caseId as string))
    .in("status", ["created", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single()) as { data: { id: string; status: string; phase: string; elapsed_minutes: number } | null; error: any };

  if (error || !data) {
    return { sessionId: null };
  }

  return { sessionId: data.id, status: data.status, phase: data.phase };
});
