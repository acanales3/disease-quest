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
  const classroomId = query.classroomId;
  const includeCompleted = query.includeCompleted === "true";

  if (!caseId) {
    throw createError({
      statusCode: 400,
      message: "caseId query param is required",
    });
  }

  let activeQuery = client
    .from("case_sessions")
    .select("id, status, phase, elapsed_minutes, created_at, attempt_number, completed_at")
    .eq("user_id", userId)
    .eq("case_id", parseInt(caseId as string));
  if (classroomId != null && classroomId !== "") {
    activeQuery = activeQuery.eq("classroom_id", parseInt(classroomId as string));
  }

  // For replay, we want the most recent completed session.
  // Some legacy rows may have completed_at set but status not updated to 'completed'.
  if (includeCompleted) {
    activeQuery = activeQuery.or("status.eq.completed,completed_at.not.is.null");
  } else {
    activeQuery = activeQuery.in("status", ["created", "in_progress"]);
  }

  const { data, error } = (await activeQuery
    .order("attempt_number", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()) as {
    data: {
      id: string;
      status: string;
      phase: string;
      elapsed_minutes: number;
      attempt_number: number;
    } | null;
    error: any;
  };

  if (error) {
    return { sessionId: null };
  }
  if (!data) {
    return { sessionId: null };
  }

  return {
    sessionId: data.id,
    status: data.status,
    phase: data.phase,
    attempt_number: data.attempt_number,
  };
});
