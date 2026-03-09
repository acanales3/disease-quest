/**
 * POST /api/sessions/replay
 * Resets a completed session so the student can play it again.
 *
 * - Deletes all session_messages and session_actions for the session
 * - Resets status → 'created', phase → 'prologue'
 * - Resets elapsed_minutes, patient_state, flags, etc. back to initial values
 * - Increments attempt_number
 * - Preserves classroom_id so the replayed session stays scoped to the
 *   same classroom as the original attempt
 * - Keeps the case_sessions row and any evaluation entries (they are preserved)
 *
 * Body: { sessionId: string }
 */
import { defineEventHandler, createError, readBody } from "h3";
import {
  serverSupabaseClient,
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);
  // @ts-ignore
  const userId = user?.id || user?.sub;

  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const body = await readBody(event);
  const { sessionId } = body;

  if (!sessionId) {
    throw createError({ statusCode: 400, message: "sessionId is required" });
  }

  // Verify ownership and that the session is completed.
  // Also fetch classroom_id so we can preserve it after reset.
  const { data: session, error: sessionErr } = await client
    .from("case_sessions")
    .select("id, user_id, case_id, status, attempt_number, completed_at, classroom_id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (sessionErr || !session) {
    throw createError({ statusCode: 404, message: "Session not found" });
  }

  if (session.status !== "completed" && !session.completed_at) {
    throw createError({
      statusCode: 400,
      message: "Only completed sessions can be replayed",
    });
  }

  // Load the case to get the initial patient state and start disclosures
  const { data: caseRow, error: caseErr } = await client
    .from("cases")
    .select("content")
    .eq("id", session.case_id)
    .single();

  if (caseErr || !caseRow) {
    throw createError({ statusCode: 404, message: "Case not found" });
  }

  const content = (caseRow.content ?? {}) as Record<string, unknown>;
  const initialPatientState = content.initial_patient_state ?? {};

  // Dynamically find disclosures that unlock at START
  const disclosures = (content.disclosures ?? []) as Array<{
    id: string;
    unlock?: { type: string };
  }>;
  const startDisclosures = disclosures
    .filter((d) => d.unlock?.type === "START")
    .map((d) => d.id);

  // Use service role to delete messages and actions (bypasses RLS)
  const serviceClient = serverSupabaseServiceRole(event);

  // Delete all session messages for this session
  const { error: msgDeleteErr } = await serviceClient
    .from("session_messages")
    .delete()
    .eq("session_id", sessionId);

  if (msgDeleteErr) {
    throw createError({
      statusCode: 500,
      message: `Failed to clear session messages: ${msgDeleteErr.message}`,
    });
  }

  // Delete all session actions for this session
  const { error: actDeleteErr } = await serviceClient
    .from("session_actions")
    .delete()
    .eq("session_id", sessionId);

  if (actDeleteErr) {
    throw createError({
      statusCode: 500,
      message: `Failed to clear session actions: ${actDeleteErr.message}`,
    });
  }

  // Reset the session back to its initial state, incrementing attempt_number.
  // classroom_id is explicitly preserved so the replay stays scoped to the
  // same classroom as the original attempt.
  const { error: updateErr } = await serviceClient
    .from("case_sessions")
    .update({
      status: "created",
      phase: "prologue",
      elapsed_minutes: 0,
      unlocked_disclosures: startDisclosures,
      patient_state: initialPatientState,
      differential_history: [],
      final_diagnosis: null,
      management_plan: [],
      scoring: {},
      flags: {
        correct_diagnosis_suspected: false,
        antibiotics_ordered: false,
        antibiotics_started: false,
        cultures_before_antibiotics: false,
        shock_addressed: false,
        seizure_addressed: false,
        airway_addressed: false,
        _triggered_actions: [],
        _triggered_events: [],
      },
      started_at: null,
      completed_at: null,
      updated_at: new Date().toISOString(),
      attempt_number: (session.attempt_number ?? 1) + 1,
      // Explicitly keep classroom_id unchanged — do NOT set to null
      classroom_id: session.classroom_id ?? null,
    })
    .eq("id", sessionId);

  if (updateErr) {
    throw createError({
      statusCode: 500,
      message: `Failed to reset session: ${updateErr.message}`,
    });
  }

  return {
    success: true,
    sessionId,
    attempt_number: (session.attempt_number ?? 1) + 1,
    message: "Session reset successfully. You can now replay the case.",
  };
});