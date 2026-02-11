/**
 * POST /api/sessions/create
 * Creates a new simulation session for a student.
 * Body: { caseId: number }
 */
import { defineEventHandler, createError, readBody } from "h3";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);
  // @ts-ignore
  const userId = user?.id || user?.sub;

  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const body = await readBody(event);
  const caseId = body?.caseId;

  if (!caseId) {
    throw createError({ statusCode: 400, message: "caseId is required" });
  }

  // Load the case to get initial patient state
  const { data: caseRow, error: caseErr } = await client
    .from("cases")
    .select("id, content")
    .eq("id", caseId)
    .single();

  if (caseErr || !caseRow) {
    throw createError({ statusCode: 404, message: "Case not found" });
  }

  const content = caseRow.content as Record<string, unknown> | null;
  const initialPatientState = content?.initial_patient_state ?? {};

  // Create the session
  const { data: session, error: sessionErr } = await client
    .from("case_sessions")
    .insert({
      student_id: userId,
      case_id: caseId,
      status: "created",
      phase: "prologue",
      elapsed_minutes: 0,
      unlocked_disclosures: ["D1"], // D1 unlocks at START
      patient_state: initialPatientState,
      differential_history: [],
      management_plan: [],
      scoring: {},
      flags: {
        meningitis_suspected: false,
        antibiotics_ordered: false,
        cultures_before_antibiotics: false,
        shock_addressed: false,
        _triggered_actions: [],
        _triggered_events: [],
      },
    })
    .select()
    .single();

  if (sessionErr || !session) {
    throw createError({
      statusCode: 500,
      message: sessionErr?.message ?? "Failed to create session",
    });
  }

  // Upsert student_cases to track progress
  await client.from("student_cases").upsert({
    student_id: userId,
    case_id: caseId,
    started_at: new Date().toISOString(),
  });

  return {
    sessionId: session.id,
    status: session.status,
    phase: session.phase,
  };
});
