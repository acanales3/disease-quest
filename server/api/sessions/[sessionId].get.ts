/**
 * GET /api/sessions/:sessionId
 * Returns the current session state.
 */
import { defineEventHandler, createError, getRouterParam } from "h3";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);
  // @ts-ignore
  const userId = user?.id || user?.sub;

  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const sessionId = getRouterParam(event, "sessionId");
  if (!sessionId) {
    throw createError({ statusCode: 400, message: "Session ID is required" });
  }

  const { data: session, error } = await client
    .from("case_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("student_id", userId)
    .single();

  if (error || !session) {
    throw createError({ statusCode: 404, message: "Session not found" });
  }

  // Load case name
  const { data: caseRow } = await client
    .from("cases")
    .select("name, content")
    .eq("id", session.case_id)
    .single();

  const content = caseRow?.content as Record<string, unknown> | null;
  const physiology = ((session.patient_state ?? {}) as Record<string, unknown>).physiology as Record<string, unknown> | undefined;
  const vitals = (physiology?.vitals ?? {}) as Record<string, unknown>;

  // Mask diagnosis from title during simulation
  let displayTitle = (content?.title ?? caseRow?.name ?? "Case") as string;
  if (session.status !== "completed" && displayTitle.includes("—")) {
    displayTitle = displayTitle.split("—")[0].trim();
  }

  return {
    sessionId: session.id,
    caseId: session.case_id,
    caseName: displayTitle,
    status: session.status,
    phase: session.phase,
    elapsedMinutes: session.elapsed_minutes,
    unlockedDisclosures: session.unlocked_disclosures ?? [],
    differentialHistory: session.differential_history ?? [],
    finalDiagnosis: session.final_diagnosis,
    managementPlan: session.management_plan ?? [],
    scoring: session.scoring ?? {},
    flags: session.flags ?? {},
    vitals: {
      temp_f: vitals.temp_f ?? null,
      hr_bpm: vitals.hr_bpm ?? null,
      bp_systolic: vitals.bp_systolic ?? null,
      bp_diastolic: vitals.bp_diastolic ?? null,
      rr_bpm: vitals.rr_bpm ?? null,
      spo2_percent: vitals.spo2_percent ?? null,
      cap_refill_sec: vitals.cap_refill_sec ?? null,
    },
    patientStatus: {
      mentalStatus: physiology?.mental_status ?? "unknown",
      hasShock: physiology?.has_shock ?? false,
      hasSeizure: physiology?.has_seizure ?? false,
    },
    startedAt: session.started_at,
    completedAt: session.completed_at,
  };
});
