/**
 * POST /api/sessions/replay
 * Creates a fresh session so the student can replay a completed case.
 *
 * The completed session (and its evaluation) are kept intact so that the
 * "attempts" counter — which counts evaluations — naturally increments
 * with every completion.
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

  const serviceClient = serverSupabaseServiceRole(event);

  // If a non-completed session already exists for this user+case+classroom,
  // return it instead of creating a duplicate.
  let guardQuery = serviceClient
    .from("case_sessions")
    .select("id, status, phase, attempt_number")
    .eq("user_id", userId)
    .eq("case_id", session.case_id)
    .in("status", ["created", "in_progress"]);

  if (session.classroom_id) {
    guardQuery = guardQuery.eq("classroom_id", session.classroom_id);
  } else {
    guardQuery = guardQuery.is("classroom_id", null);
  }

  const { data: existingActive } = await guardQuery
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingActive) {
    return {
      success: true,
      sessionId: existingActive.id,
      attempt_number: existingActive.attempt_number,
      message: "Active session already exists for this case.",
    };
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

  const disclosures = (content.disclosures ?? []) as Array<{
    id: string;
    unlock?: { type: string };
  }>;
  const startDisclosures = disclosures
    .filter((d) => d.unlock?.type === "START")
    .map((d) => d.id);

  const newAttempt = (session.attempt_number ?? 1) + 1;

  const { data: newSession, error: insertErr } = await serviceClient
    .from("case_sessions")
    .insert({
      user_id: userId,
      case_id: session.case_id,
      classroom_id: session.classroom_id ?? null,
      status: "created",
      phase: "prologue",
      elapsed_minutes: 0,
      unlocked_disclosures: startDisclosures,
      patient_state: initialPatientState,
      differential_history: [],
      management_plan: [],
      scoring: {},
      attempt_number: newAttempt,
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
    } as any)
    .select()
    .single();

  if (insertErr || !newSession) {
    throw createError({
      statusCode: 500,
      message: `Failed to create replay session: ${insertErr?.message ?? "unknown error"}`,
    });
  }

  return {
    success: true,
    sessionId: (newSession as any).id,
    attempt_number: newAttempt,
    message: "New session created for replay. Previous evaluation is preserved.",
  };
});