/**
 * GET /api/sessions/active?caseId=52&includeCompleted=true
 * Returns the most recent session for this user + case.
 *
 * By default only returns non-completed sessions (created/in_progress).
 * Pass includeCompleted=true to also match completed sessions (used by replay).
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
  const includeCompleted = query.includeCompleted === "true";

  if (!caseId) {
    throw createError({
      statusCode: 400,
      message: "caseId query param is required",
    });
  }

  const statuses = includeCompleted
    ? ["created", "in_progress", "completed"]
    : ["created", "in_progress"];

  const { data, error } = (await client
    .from("case_sessions")
    .select("id, status, phase, elapsed_minutes, created_at, attempt_number")
    .eq("user_id", userId)
    .eq("case_id", parseInt(caseId as string))
    .in("status", statuses)
    .order("attempt_number", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .single()) as {
    data: {
      id: string;
      status: string;
      phase: string;
      elapsed_minutes: number;
      attempt_number: number;
    } | null;
    error: any;
  };

  if (error || !data) {
    return { sessionId: null };
  }

  return {
    sessionId: data.id,
    status: data.status,
    phase: data.phase,
    attempt_number: data.attempt_number,
  };
});
