/**
 * GET /api/sessions/active?caseId=52&classroomId=3&includeCompleted=true
 * Returns the most recent session for this user + case + classroom.
 *
 * classroomId is optional — if omitted, falls back to matching any session
 * for the case (used by admins/instructors who have no classroom context).
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
  const classroomId = query.classroomId; // optional
  const includeCompleted = query.includeCompleted === "true";

  if (!caseId) {
    throw createError({
      statusCode: 400,
      message: "caseId query param is required",
    });
  }

  let dbQuery = client
    .from("case_sessions")
    .select("id, status, phase, elapsed_minutes, created_at, attempt_number, classroom_id")
    .eq("user_id", userId)
    .eq("case_id", parseInt(caseId as string));

  // If classroomId is provided, scope the lookup to that classroom only.
  if (classroomId) {
    dbQuery = dbQuery.eq("classroom_id", parseInt(classroomId as string));
  }

  // For replay (includeCompleted): match completed or rows with completed_at (legacy).
  if (includeCompleted) {
    dbQuery = dbQuery.or("status.eq.completed,completed_at.not.is.null");
  } else {
    dbQuery = dbQuery.in("status", ["created", "in_progress"]);
  }

  const { data, error } = (await dbQuery
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
      classroom_id: number | null;
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
    classroom_id: data.classroom_id,
  };
});