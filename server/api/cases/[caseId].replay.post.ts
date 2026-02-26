/**
 * POST /api/cases/:caseId/replay
 *
 * Creates a fresh case_session for the current user so they can replay
 * a case they have already completed (or start a new attempt at any time).
 *
 * Logic:
 *  1. Verify the user is authenticated.
 *  2. Find the highest existing attempt_number for this user+case.
 *  3. Create a brand-new session with attempt_number = max + 1.
 *  4. Return the new session ID so the client can redirect to it.
 *
 * The previous session (and all its messages / actions) is left untouched
 * in the database for analytics — it is NOT deleted.
 */
import { defineEventHandler, createError, getRouterParam } from "h3";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);

  const userId = (user as any)?.id || (user as any)?.sub;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const caseId = getRouterParam(event, "caseId");
  if (!caseId) {
    throw createError({ statusCode: 400, message: "Case ID is required" });
  }
  const caseIdNum = parseInt(caseId, 10);

  // 1. Verify the case exists
  const { data: caseRow, error: caseErr } = await client
    .from("cases")
    .select("id, content")
    .eq("id", caseIdNum)
    .single();

  if (caseErr || !caseRow) {
    throw createError({ statusCode: 404, message: "Case not found" });
  }

  // 2. Find the highest attempt number for this user+case
  const { data: existingSessions, error: sessErr } = await client
    .from("case_sessions")
    .select("attempt_number, status")
    .eq("user_id", userId)
    .eq("case_id", caseIdNum)
    .order("attempt_number", { ascending: false })
    .limit(1);

  if (sessErr) {
    throw createError({ statusCode: 500, message: sessErr.message });
  }

  const latestSession = (existingSessions ?? [])[0] as
    | { attempt_number: number; status: string }
    | undefined;

  // Guard: if there's already an active (non-completed) session, return it
  // instead of creating a duplicate. The client should resume that session.
  if (
    latestSession &&
    (latestSession.status === "in_progress" ||
      latestSession.status === "created")
  ) {
    // Find the actual session id for redirect
    const { data: activeSession } = await client
      .from("case_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("case_id", caseIdNum)
      .eq("attempt_number", latestSession.attempt_number)
      .single();

    return {
      sessionId: (activeSession as any)?.id ?? null,
      attemptNumber: latestSession.attempt_number,
      isExisting: true,
      message: "Resumed existing active session.",
    };
  }

  // 3. Determine new attempt number
  const nextAttempt = latestSession ? latestSession.attempt_number + 1 : 1;

  // 4. Seed the new session with the case's initial patient state
  const content = (caseRow as any).content as Record<string, unknown> | null;
  const initialPatientState = content?.initial_patient_state ?? {};

  const { data: newSession, error: insertErr } = await client
    .from("case_sessions")
    .insert({
      user_id: userId,
      case_id: caseIdNum,
      status: "created",
      phase: "prologue",
      elapsed_minutes: 0,
      unlocked_disclosures: [],
      patient_state: initialPatientState,
      differential_history: [],
      management_plan: [],
      scoring: {},
      flags: {},
      attempt_number: nextAttempt,
    })
    .select("id, attempt_number")
    .single();

  if (insertErr || !newSession) {
    throw createError({
      statusCode: 500,
      message: `Failed to create new session: ${insertErr?.message ?? "unknown error"}`,
    });
  }

  return {
    sessionId: (newSession as any).id as string,
    attemptNumber: (newSession as any).attempt_number as number,
    isExisting: false,
    message: `Attempt #${nextAttempt} started. Good luck!`,
  };
});
