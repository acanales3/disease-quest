/**
 * Orchestrator – Supabase Edge Function
 *
 * Central coordinator for the DiseaseQuest simulation.
 * Routes student actions to appropriate agents, manages state,
 * checks disclosure unlocks and deterioration rules.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";

type ActionType =
  | "ask_patient"
  | "perform_exam"
  | "order_test"
  | "get_results"
  | "administer_treatment"
  | "consult_tutor"
  | "update_differential"
  | "submit_diagnosis"
  | "end_case"
  | "advance_time";

interface OrchestratorRequest {
  sessionId: string;
  actionType: ActionType;
  payload: {
    content?: string;
    testId?: string;
    rationale?: string;
    treatment?: string;
    differential?: Array<{ diagnosis: string; likelihood: string; reasoning?: string }>;
    diagnosis?: string;
    reasoning?: string;
    minutes?: number;
  };
}

// ── Helper: call another edge function ──────────────────────────
async function callAgent(
  fnName: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const res = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Agent ${fnName} failed (${res.status}): ${errText}`);
  }
  return res.json();
}

// ── Helper: check disclosure unlocks ────────────────────────────
function checkDisclosureUnlocks(
  disclosures: Array<Record<string, unknown>>,
  unlocked: string[],
  elapsedMinutes: number,
  triggeredActions: string[],
  triggeredEvents: string[]
): string[] {
  const newlyUnlocked: string[] = [];

  for (const d of disclosures) {
    const id = d.id as string;
    if (unlocked.includes(id)) continue;

    const unlock = d.unlock as { type: string; condition?: string };
    let shouldUnlock = false;

    switch (unlock.type) {
      case "START":
        shouldUnlock = true;
        break;

      case "TIME":
        if (unlock.condition) {
          const timeMatch = unlock.condition.match(/time\s*>=\s*(\d+)/);
          if (timeMatch && elapsedMinutes >= parseInt(timeMatch[1])) shouldUnlock = true;
        }
        break;

      case "ACTION":
        if (unlock.condition) {
          // Check if relevant actions triggered
          if (triggeredActions.some((a) => unlock.condition!.includes(a))) shouldUnlock = true;
        }
        break;

      case "ACTION_OR_TIME":
      case "ACTION_OR_STAGE":
      case "TIME_OR_ACTION": {
        if (unlock.condition) {
          // Check time component
          const timeMatch = unlock.condition.match(/time\s*>=\s*(\d+)/);
          if (timeMatch && elapsedMinutes >= parseInt(timeMatch[1])) shouldUnlock = true;
          // Check action component
          if (triggeredActions.some((a) => unlock.condition!.includes(a))) shouldUnlock = true;
        }
        break;
      }

      case "STATE":
        if (unlock.condition) {
          const timeMatch = unlock.condition.match(/time\s*>=\s*(\d+)/);
          if (timeMatch && elapsedMinutes >= parseInt(timeMatch[1])) shouldUnlock = true;
          if (triggeredActions.some((a) => unlock.condition!.includes(a))) shouldUnlock = true;
        }
        break;

      case "EVENT":
        if (unlock.condition) {
          if (triggeredEvents.some((e) => unlock.condition!.includes(e))) shouldUnlock = true;
        }
        break;
    }

    if (shouldUnlock) newlyUnlocked.push(id);
  }

  return newlyUnlocked;
}

// ── Helper: check deterioration rules ───────────────────────────
function checkDeteriorationRules(
  rules: Array<Record<string, unknown>>,
  flags: Record<string, boolean>,
  elapsedMinutes: number,
  triggeredEvents: string[]
): Array<{ event: string; notes: string }> {
  const newEvents: Array<{ event: string; notes: string }> = [];

  for (const rule of rules) {
    const condition = (rule.if ?? "") as string;
    const then = (rule.then ?? {}) as { event: string; notes: string };

    if (triggeredEvents.includes(then.event)) continue;

    if (
      condition.includes("suspected_meningitis_flagged == false") &&
      condition.includes("time >= 5")
    ) {
      if (!flags.meningitis_suspected && elapsedMinutes >= 5) {
        newEvents.push(then);
      }
    } else if (
      condition.includes("antibiotics_started == false") &&
      condition.includes("time >= 8")
    ) {
      if (!flags.antibiotics_ordered && elapsedMinutes >= 8) {
        newEvents.push(then);
      }
    } else if (
      condition.includes("shock_unaddressed == true") &&
      condition.includes("time >= 12")
    ) {
      if (!flags.shock_addressed && elapsedMinutes >= 12) {
        newEvents.push(then);
      }
    }
  }

  return newEvents;
}

// ── Helper: apply deterioration to patient state ────────────────
function applyDeterioration(
  patientState: Record<string, unknown>,
  event: string
): Record<string, unknown> {
  const ps = { ...patientState };
  const physiology = { ...(ps.physiology as Record<string, unknown>) };
  const vitals = { ...(physiology.vitals as Record<string, unknown>) };

  if (event === "clinical_worsening_warning") {
    vitals.hr_bpm = Math.min(((vitals.hr_bpm as number) ?? 180) + 10, 220);
    vitals.temp_f = Math.min(((vitals.temp_f as number) ?? 103.5) + 0.5, 106);
    physiology.mental_status = "obtunded";
  } else if (event === "seizure_and_shock_event") {
    vitals.bp_systolic = 45;
    vitals.bp_diastolic = 25;
    vitals.hr_bpm = 200;
    vitals.spo2_percent = 85;
    physiology.has_shock = true;
    physiology.has_seizure = true;
    physiology.mental_status = "obtunded";
  } else if (event === "multi_organ_risk") {
    vitals.bp_systolic = 40;
    vitals.spo2_percent = 78;
    physiology.has_respiratory_failure = true;
    physiology.mental_status = "comatose";
  }

  physiology.vitals = vitals;
  ps.physiology = physiology;
  ps.emotional_state = "distressed";
  return ps;
}

// ── Helper: apply treatment to patient state ────────────────────
function applyTreatment(
  patientState: Record<string, unknown>,
  treatment: string
): Record<string, unknown> {
  const ps = { ...patientState };
  const physiology = { ...(ps.physiology as Record<string, unknown>) };
  const vitals = { ...(physiology.vitals as Record<string, unknown>) };
  const lower = treatment.toLowerCase();

  if (["ceftriaxone", "vancomycin", "antibiotic", "empiric"].some((a) => lower.includes(a))) {
    physiology.antibiotics_started = true;
    // Antibiotics begin treating the infection — gradual HR improvement
    vitals.hr_bpm = Math.max(((vitals.hr_bpm as number) ?? 200) - 20, 150);
    // Fever starts to come down slowly
    vitals.temp_f = Math.max(((vitals.temp_f as number) ?? 104) - 0.5, 101);
  }
  if (lower.includes("fluid") || lower.includes("bolus")) {
    physiology.fluids_given = true;
    vitals.bp_systolic = Math.min(((vitals.bp_systolic as number) ?? 45) + 15, 80);
    vitals.bp_diastolic = Math.min(((vitals.bp_diastolic as number) ?? 25) + 10, 50);
    vitals.cap_refill_sec = Math.max(((vitals.cap_refill_sec as number) ?? 6) - 1, 3);
    // Fluids help reduce tachycardia
    vitals.hr_bpm = Math.max(((vitals.hr_bpm as number) ?? 200) - 15, 140);
  }
  if (["dopamine", "epinephrine", "vasopressor"].some((v) => lower.includes(v))) {
    physiology.vasopressors_started = true;
    // Vasopressors address shock — BP improves, HR comes down
    vitals.bp_systolic = Math.min(((vitals.bp_systolic as number) ?? 45) + 25, 85);
    vitals.bp_diastolic = Math.min(((vitals.bp_diastolic as number) ?? 25) + 15, 55);
    vitals.cap_refill_sec = Math.max(((vitals.cap_refill_sec as number) ?? 6) - 2, 2);
    vitals.hr_bpm = Math.max(((vitals.hr_bpm as number) ?? 200) - 25, 130);
    physiology.has_shock = false;
  }
  if (lower.includes("dexamethasone")) {
    physiology.dexamethasone_given = true;
    // Anti-inflammatory — helps reduce fever and inflammation
    vitals.temp_f = Math.max(((vitals.temp_f as number) ?? 104) - 1, 100);
    vitals.hr_bpm = Math.max(((vitals.hr_bpm as number) ?? 200) - 10, 140);
  }
  if (lower.includes("intubat") || lower.includes("ventilat") || lower.includes("mechanical")) {
    physiology.is_intubated = true;
    physiology.has_respiratory_failure = false;
    vitals.spo2_percent = 98;
    vitals.rr_bpm = 25; // Ventilator-controlled
  }
  if (lower.includes("diazepam") || lower.includes("lorazepam") || lower.includes("seizure") || lower.includes("benzodiazepine")) {
    physiology.has_seizure = false;
    // Post-seizure: HR drops, mental status improves
    vitals.hr_bpm = Math.max(((vitals.hr_bpm as number) ?? 200) - 20, 140);
    if (physiology.mental_status === "obtunded") {
      physiology.mental_status = "lethargic";
    }
  }

  physiology.vitals = vitals;
  ps.physiology = physiology;
  return ps;
}

// ── Main handler ────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const db = getSupabaseClient();

  try {
    const { sessionId, actionType, payload }: OrchestratorRequest = await req.json();

    // 1. Load session
    const { data: session, error: sessionErr } = await db
      .from("case_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionErr || !session) {
      return json({ error: "Session not found" }, 404);
    }

    // 2. Load case content
    const { data: caseRow, error: caseErr } = await db
      .from("cases")
      .select("id, name, content")
      .eq("id", session.case_id)
      .single();

    if (caseErr || !caseRow?.content) {
      return json({ error: "Case content not found" }, 404);
    }

    const caseContent = caseRow.content as Record<string, unknown>;
    const disclosures = (caseContent.disclosures ?? []) as Array<Record<string, unknown>>;
    const diagnosticTests = (caseContent.diagnostic_tests ?? []) as Array<Record<string, unknown>>;
    const testResults = (caseContent.test_results ?? {}) as Record<string, Record<string, unknown>>;
    const deteriorationRules = (caseContent.deterioration_rules ?? []) as Array<Record<string, unknown>>;

    // Session state
    let patientState = (session.patient_state ?? caseContent.initial_patient_state ?? {}) as Record<string, unknown>;
    let unlockedDisclosures: string[] = session.unlocked_disclosures ?? [];
    let elapsedMinutes: number = session.elapsed_minutes ?? 0;
    let flags = (session.flags ?? {}) as Record<string, boolean>;
    let differentialHistory = (session.differential_history ?? []) as Array<Record<string, unknown>>;
    let managementPlan = (session.management_plan ?? []) as string[];
    let scoring = (session.scoring ?? {}) as Record<string, unknown>;
    const triggeredActions: string[] = (flags._triggered_actions as unknown as string[]) ?? [];
    const triggeredEvents: string[] = (flags._triggered_events as unknown as string[]) ?? [];

    // Load conversation history
    const { data: messages } = await db
      .from("session_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(50);

    const conversationHistory = (messages ?? []) as Array<{ role: string; content: string }>;

    // Load ordered tests from actions (order data is in the response field)
    const { data: testOrderActions } = await db
      .from("session_actions")
      .select("target, payload, response, elapsed_minutes")
      .eq("session_id", sessionId)
      .eq("action_type", "order_test");

    const orderedTests: Record<string, { testId: string; orderedAt: number; resultAvailableAt: number }> = {};
    for (const a of testOrderActions ?? []) {
      const tid = a.target as string;
      if (!tid) continue;
      // Try to get order data from response (where diagnostic-agent puts it)
      const resp = (a.response ?? {}) as Record<string, unknown>;
      if (resp.order) {
        orderedTests[tid] = resp.order as { testId: string; orderedAt: number; resultAvailableAt: number };
      } else if (resp.ordered_at !== undefined) {
        // Fallback: reconstruct from response fields
        orderedTests[tid] = {
          testId: tid,
          orderedAt: (resp.ordered_at ?? a.elapsed_minutes ?? 0) as number,
          resultAvailableAt: ((resp.expected_result_at ?? (a.elapsed_minutes as number ?? 0) + 1)) as number,
        };
      } else {
        // Last resort: use action timestamp
        orderedTests[tid] = {
          testId: tid,
          orderedAt: (a.elapsed_minutes ?? 0) as number,
          resultAvailableAt: ((a.elapsed_minutes as number ?? 0) + 1),
        };
      }
    }

    let responseData: Record<string, unknown> = {};
    let actionTypeDb = actionType.replace(/_/g, "_");

    // ─── Route to agent ──────────────────────────────────────────

    if (actionType === "ask_patient") {
      responseData = await callAgent("patient-agent", {
        question: payload.content ?? "",
        patientState,
        unlockedDisclosures,
        disclosures,
        conversationHistory,
        elapsedMinutes,
      });

      // Save messages
      await db.from("session_messages").insert([
        { session_id: sessionId, role: "student", content: payload.content ?? "" },
        { session_id: sessionId, role: "patient", content: (responseData as Record<string, unknown>).response ?? "" },
      ]);

      actionTypeDb = "ask";
    }

    else if (actionType === "perform_exam") {
      triggeredActions.push("student_requests_exam");
      const physiology = (patientState.physiology ?? {}) as Record<string, unknown>;
      const vitals = (physiology.vitals ?? {}) as Record<string, unknown>;

      responseData = {
        type: "exam_findings",
        exam_type: payload.content ?? "complete",
        findings: {
          general_appearance: physiology.mental_status === "lethargic"
            ? "Lethargic, minimally responsive to stimulation; appears flushed and warm to touch"
            : "See current mental status",
          vitals: {
            temperature: `${vitals.temp_f ?? "?"}°F`,
            heart_rate: `${vitals.hr_bpm ?? "?"} bpm`,
            blood_pressure: `${vitals.bp_systolic ?? "?"}/${vitals.bp_diastolic ?? "?"} mmHg`,
            respiratory_rate: `${vitals.rr_bpm ?? "?"}/min`,
            oxygen_saturation: `${vitals.spo2_percent ?? "?"}%`,
            capillary_refill: `${vitals.cap_refill_sec ?? "?"} seconds`,
          },
          mental_status: physiology.mental_status ?? "unknown",
          skin: {
            rash: physiology.rash ?? "None visible",
            other_findings: physiology.skin_findings ?? [],
          },
          neurological: physiology.neuro_signs ?? [],
        },
      };
      actionTypeDb = "perform_exam";
    }

    else if (actionType === "order_test") {
      const testId = payload.testId ?? payload.content ?? "";

      // Track cultures before antibiotics
      if (testId === "blood_cultures" && !flags.antibiotics_ordered) {
        flags.cultures_before_antibiotics = true;
      }

      responseData = await callAgent("diagnostic-agent", {
        action: "order",
        testId,
        rationale: payload.rationale ?? "",
        elapsedMinutes,
        diagnosticTests,
        testResults,
        orderedTests,
      });

      if ((responseData as Record<string, unknown>).success) {
        triggeredActions.push(`student_orders_${testId}`);
        if (testId === "lp_csf_panel") {
          triggeredActions.push("student_orders_lp_and_csf_panel");
        }
        // Store the order in orderedTests for future reference
        if ((responseData as Record<string, unknown>).order) {
          orderedTests[testId] = (responseData as Record<string, unknown>).order as {
            testId: string; orderedAt: number; resultAvailableAt: number;
          };
        }
      }
      actionTypeDb = "order_test";
    }

    else if (actionType === "get_results") {
      const testId = payload.testId ?? payload.content ?? "";

      responseData = await callAgent("diagnostic-agent", {
        action: "get_results",
        testId,
        elapsedMinutes,
        diagnosticTests,
        testResults,
        orderedTests,
      });

      if ((responseData as Record<string, unknown>).status === "complete") {
        triggeredActions.push(`student_reviews_${testId}`);
        if (testId === "lp_csf_panel") {
          triggeredActions.push("student_reviews_csf_results");
        }
      }
      actionTypeDb = "interpret";
    }

    else if (actionType === "administer_treatment") {
      const treatment = payload.treatment ?? payload.content ?? "";
      patientState = applyTreatment(patientState, treatment);

      const lower = (treatment as string).toLowerCase();
      if (["ceftriaxone", "vancomycin", "antibiotic", "empiric"].some((a) => lower.includes(a))) {
        flags.antibiotics_ordered = true;
        triggeredActions.push("antibiotics_started");
      }
      if (["dopamine", "epinephrine", "vasopressor", "fluid", "bolus"].some((v) => lower.includes(v))) {
        flags.shock_addressed = true;
      }
      if (["seizure", "diazepam", "lorazepam", "benzodiazepine"].some((s) => lower.includes(s))) {
        flags.seizure_addressed = true;
      }
      if (lower.includes("intubat") || lower.includes("ventilat") || lower.includes("mechanical")) {
        flags.airway_addressed = true;
      }

      if (!managementPlan.includes(treatment as string)) {
        managementPlan.push(treatment as string);
      }

      // Build response message based on what was given
      const physiology = (patientState.physiology ?? {}) as Record<string, unknown>;
      const vitals = (physiology.vitals ?? {}) as Record<string, unknown>;
      const statusUpdate = [];
      if (vitals.bp_systolic) statusUpdate.push(`BP now ${vitals.bp_systolic}/${vitals.bp_diastolic}`);
      if (physiology.has_shock === false && lower.includes("vasopressor")) statusUpdate.push("Shock resolving");
      if (physiology.has_seizure === false && (lower.includes("seizure") || lower.includes("diazepam"))) statusUpdate.push("Seizure aborted");
      if (physiology.is_intubated === true && lower.includes("intubat")) statusUpdate.push("Patient intubated, SpO2 improving");

      responseData = {
        type: "treatment_administered",
        treatment,
        message: `${treatment} has been administered.${statusUpdate.length ? ' ' + statusUpdate.join('. ') + '.' : ''}`,
        patient_response: "Treatment administered. Monitor for response.",
      };
      actionTypeDb = "administer";
    }

    else if (actionType === "consult_tutor") {
      responseData = await callAgent("tutor-agent", {
        question: payload.content ?? "",
        caseContent,
        sessionContext: {
          elapsedMinutes,
          phase: session.phase,
          differential: differentialHistory.length > 0
            ? (differentialHistory[differentialHistory.length - 1] as Record<string, unknown>).diagnoses ?? []
            : [],
          testsOrdered: Object.keys(orderedTests),
          testResults: [],
          treatmentsGiven: managementPlan,
          vitals: ((patientState.physiology ?? {}) as Record<string, unknown>).vitals ?? {},
          patientStatus: {
            has_shock: ((patientState.physiology ?? {}) as Record<string, unknown>).has_shock ?? false,
            has_seizure: ((patientState.physiology ?? {}) as Record<string, unknown>).has_seizure ?? false,
            mental_status: ((patientState.physiology ?? {}) as Record<string, unknown>).mental_status ?? "unknown",
          },
          conversationHistory,
        },
      });

      await db.from("session_messages").insert([
        { session_id: sessionId, role: "student", content: `[To Tutor] ${payload.content ?? ""}` },
        { session_id: sessionId, role: "tutor", content: (responseData as Record<string, unknown>).response ?? "" },
      ]);
      actionTypeDb = "consult";
    }

    else if (actionType === "update_differential") {
      const differential = payload.differential ?? [];
      differentialHistory.push({
        timestamp_minutes: elapsedMinutes,
        diagnoses: differential,
      });

      // Check if meningitis is suspected
      for (const dx of differential) {
        if ((dx.diagnosis ?? "").toLowerCase().includes("meningitis")) {
          flags.meningitis_suspected = true;
          triggeredActions.push("student_flags_meningitis");
          break;
        }
      }

      responseData = {
        type: "differential_updated",
        differential,
        message: "Differential diagnosis updated.",
      };
      actionTypeDb = "differential";
    }

    else if (actionType === "submit_diagnosis") {
      responseData = {
        type: "diagnosis_recorded",
        diagnosis: payload.diagnosis ?? "",
        message: "Final diagnosis recorded. You can continue managing the patient or end the case for evaluation.",
      };
      actionTypeDb = "diagnose";
    }

    else if (actionType === "advance_time") {
      const minutes = payload.minutes ?? 5;
      elapsedMinutes += minutes;
      responseData = {
        type: "time_advanced",
        elapsed_minutes: elapsedMinutes,
        message: `Time advanced by ${minutes} minutes. Current time: ${elapsedMinutes} min.`,
      };
      actionTypeDb = "note";
    }

    else if (actionType === "end_case") {
      // Call evaluator
      const evalResult = await callAgent("evaluator-agent", {
        caseContent,
        sessionData: {
          elapsedMinutes,
          finalDiagnosis: (session.final_diagnosis as Record<string, unknown>)?.diagnosis ?? payload.diagnosis ?? null,
          finalDiagnosisReasoning: (session.final_diagnosis as Record<string, unknown>)?.reasoning ?? payload.reasoning ?? null,
          differentialHistory,
          testOrders: Object.entries(orderedTests).map(([tid, o]) => ({
            testId: tid,
            orderedAt: o.orderedAt,
            hasResults: elapsedMinutes >= o.resultAvailableAt,
          })),
          actionLog: (
            await db
              .from("session_actions")
              .select("actor, action_type, target, payload, response, elapsed_minutes")
              .eq("session_id", sessionId)
              .order("created_at", { ascending: true })
          ).data ?? [],
          conversationHistory,
          flags,
          treatmentsAdministered: managementPlan,
        },
      });

      // Write evaluation to evaluations table
      const dbScores = (evalResult as Record<string, unknown>).db_scores as Record<string, number | null>;
      if (dbScores) {
        await db.from("evaluations").insert({
          student_id: session.student_id,
          case_id: session.case_id,
          ...dbScores,
          reflection_document: JSON.stringify((evalResult as Record<string, unknown>).evaluation ?? {}),
        });
      }

      // Update student_cases
      await db
        .from("student_cases")
        .upsert({
          student_id: session.student_id,
          case_id: session.case_id,
          started_at: session.started_at ?? session.created_at,
          completed_at: new Date().toISOString(),
        });

      scoring = (evalResult as Record<string, unknown>).evaluation as Record<string, unknown> ?? {};

      responseData = {
        type: "case_completed",
        evaluation: (evalResult as Record<string, unknown>).evaluation ?? {},
        total_score: (evalResult as Record<string, unknown>).total_score ?? 0,
        max_score: (evalResult as Record<string, unknown>).max_score ?? 100,
        percentage: (evalResult as Record<string, unknown>).percentage ?? 0,
      };
      actionTypeDb = "note";
    }

    else {
      return json({ error: `Unknown action type: ${actionType}` }, 400);
    }

    // ─── Check disclosure unlocks ────────────────────────────────
    const newlyUnlocked = checkDisclosureUnlocks(
      disclosures,
      unlockedDisclosures,
      elapsedMinutes,
      triggeredActions,
      triggeredEvents
    );
    if (newlyUnlocked.length > 0) {
      unlockedDisclosures = [...unlockedDisclosures, ...newlyUnlocked];
    }

    // ─── Check deterioration events ──────────────────────────────
    const newDetEvents = checkDeteriorationRules(
      deteriorationRules,
      flags,
      elapsedMinutes,
      triggeredEvents
    );
    const deteriorationMessages: string[] = [];
    for (const evt of newDetEvents) {
      triggeredEvents.push(evt.event);
      patientState = applyDeterioration(patientState, evt.event);
      deteriorationMessages.push(evt.notes);

      // Unlock any event-triggered disclosures
      const eventUnlocks = checkDisclosureUnlocks(
        disclosures,
        unlockedDisclosures,
        elapsedMinutes,
        triggeredActions,
        triggeredEvents
      );
      if (eventUnlocks.length > 0) {
        unlockedDisclosures = [...unlockedDisclosures, ...eventUnlocks];
      }
    }

    // ─── AI Clinical Engine: dynamic physiology ─────────────────
    // Call the clinical engine to determine realistic vital changes
    // based on the full clinical picture (replaces deterministic rules)
    if (actionType !== "end_case" && actionType !== "update_differential" && actionType !== "submit_diagnosis") {
      try {
        const physiology = (patientState.physiology ?? {}) as Record<string, unknown>;
        const vitals = (physiology.vitals ?? {}) as Record<string, unknown>;

        // Build full case context for the clinical engine
        const caseContext = {
          correct_diagnosis: caseContent.correct_diagnosis ?? "Acute Bacterial Meningitis",
          setting: caseContent.setting ?? "Emergency Department → PICU",
          difficulty: caseContent.difficulty ?? "High acuity",
          key_findings: caseContent.key_findings ?? [],
          // Include deterioration rules so the engine knows the thresholds
          deterioration_rules: (caseContent.deterioration_rules ?? []) as Array<Record<string, unknown>>,
          // Include available interventions so engine knows what's possible
          interventions: ((caseContent.interventions ?? []) as Array<Record<string, unknown>>).map(
            (i) => ({ id: i.id, name: i.display_name })
          ),
          // Include the patient's initial state for baseline comparison
          initial_vitals: caseContent.initial_vitals ?? {},
          // Include unlocked disclosure content so engine knows what's been revealed
          unlocked_disclosure_content: disclosures
            .filter((d) => unlockedDisclosures.includes(d.id as string))
            .map((d) => ({ id: d.id, title: d.title, content: d.content })),
          // Scoring rules so engine can factor in clinical priorities
          scoring_categories: caseContent.scoring_categories ?? {},
        };

        const engineResult = await callAgent("clinical-engine", {
          lastAction: {
            type: actionType,
            detail: payload.treatment ?? payload.testId ?? payload.content ?? actionType,
          },
          patientState: {
            vitals: {
              hr_bpm: vitals.hr_bpm ?? 180,
              bp_systolic: vitals.bp_systolic ?? 70,
              bp_diastolic: vitals.bp_diastolic ?? 50,
              temp_f: vitals.temp_f ?? 103.5,
              rr_bpm: vitals.rr_bpm ?? 50,
              spo2_percent: vitals.spo2_percent ?? 98,
              cap_refill_sec: vitals.cap_refill_sec ?? 6,
            },
            mental_status: physiology.mental_status ?? "lethargic",
            has_shock: (physiology.has_shock ?? false) as boolean,
            has_seizure: (physiology.has_seizure ?? false) as boolean,
            has_respiratory_failure: (physiology.has_respiratory_failure ?? false) as boolean,
            is_intubated: (physiology.is_intubated ?? false) as boolean,
            antibiotics_started: (physiology.antibiotics_started ?? false) as boolean,
            fluids_given: (physiology.fluids_given ?? false) as boolean,
            vasopressors_started: (physiology.vasopressors_started ?? false) as boolean,
            dexamethasone_given: (physiology.dexamethasone_given ?? false) as boolean,
          },
          treatmentsGiven: managementPlan,
          testsOrdered: Object.keys(orderedTests),
          elapsedMinutes,
          caseContext,
          flags: {
            meningitis_suspected: !!flags.meningitis_suspected,
            antibiotics_ordered: !!flags.antibiotics_ordered,
            shock_addressed: !!flags.shock_addressed,
          },
        });

        // Apply AI-determined vitals, but preserve treatment effects
        const er = engineResult as Record<string, unknown>;
        if (er.vitals) {
          const newVitals = er.vitals as Record<string, unknown>;
          const updatedPhysiology = { ...(patientState.physiology as Record<string, unknown>) };
          const currentVitals = { ...(updatedPhysiology.vitals as Record<string, unknown>) };

          // Only accept AI vitals if they're reasonable improvements when treatments were given
          // If vasopressors/fluids were given, BP must not go LOWER than what deterministic rules set
          if (physiology.vasopressors_started || physiology.fluids_given) {
            newVitals.bp_systolic = Math.max((newVitals.bp_systolic as number) ?? 0, (currentVitals.bp_systolic as number) ?? 0);
            newVitals.bp_diastolic = Math.max((newVitals.bp_diastolic as number) ?? 0, (currentVitals.bp_diastolic as number) ?? 0);
          }
          // If antibiotics given, HR should not go higher than current
          if (physiology.antibiotics_started) {
            newVitals.hr_bpm = Math.min((newVitals.hr_bpm as number) ?? 999, (currentVitals.hr_bpm as number) ?? 999);
          }
          // If intubated, SpO2 must stay >= 95
          if (physiology.is_intubated) {
            newVitals.spo2_percent = Math.max((newVitals.spo2_percent as number) ?? 0, 95);
          }

          updatedPhysiology.vitals = { ...currentVitals, ...newVitals };

          // Mental status: AI can set it, but if treatments resolve the cause, don't let it worsen
          if (er.mental_status) {
            const statusOrder = ["alert", "drowsy", "lethargic", "obtunded", "stuporous", "comatose"];
            const currentIdx = statusOrder.indexOf(updatedPhysiology.mental_status as string);
            const newIdx = statusOrder.indexOf(er.mental_status as string);
            // If vasopressors + fluids + antibiotics are all given, only allow improvement or same
            if (physiology.vasopressors_started && physiology.antibiotics_started) {
              if (newIdx <= currentIdx) updatedPhysiology.mental_status = er.mental_status;
              // Otherwise keep current (don't worsen)
            } else {
              updatedPhysiology.mental_status = er.mental_status;
            }
          }

          // Boolean flags: treatments always take priority
          // If vasopressors were given, shock MUST clear (clinical reality)
          if (physiology.vasopressors_started) {
            updatedPhysiology.has_shock = false;
          } else if (er.has_shock !== undefined) {
            updatedPhysiology.has_shock = er.has_shock;
          }

          // If benzodiazepines/seizure treatment given, seizure MUST clear
          if (actionType === "administer_treatment" && 
              ["seizure", "diazepam", "lorazepam", "benzodiazepine"].some(s => (payload.treatment ?? "").toLowerCase().includes(s))) {
            updatedPhysiology.has_seizure = false;
          } else if (er.has_seizure !== undefined) {
            updatedPhysiology.has_seizure = er.has_seizure;
          }

          // If intubated, respiratory failure MUST clear
          if (physiology.is_intubated) {
            updatedPhysiology.has_respiratory_failure = false;
          } else if (er.has_respiratory_failure !== undefined) {
            updatedPhysiology.has_respiratory_failure = er.has_respiratory_failure;
          }

          patientState = { ...patientState, physiology: updatedPhysiology };
        }

        // Handle new clinical events from the engine
        // But only if the corresponding treatment hasn't been given
        if (er.new_event && typeof er.new_event === "string") {
          // Don't trigger shock event if vasopressors already running
          const isShockEvent = (er.new_event as string).toLowerCase().includes("shock");
          const isSeizureEvent = (er.new_event as string).toLowerCase().includes("seizure");
          
          if (isShockEvent && physiology.vasopressors_started) {
            // Ignore — shock can't recur with pressors running
          } else if (isSeizureEvent && (er.has_seizure === false)) {
            // Ignore — seizure already treated
          } else {
            deteriorationMessages.push(er.new_event as string);
            if (er.has_shock === true && !physiology.vasopressors_started) flags.shock_addressed = false;
            if (er.has_seizure === true) triggeredEvents.push("seizure_and_shock_event");
          }
        }

        // Add clinical note to response
        if (er.clinical_note) {
          responseData = { ...responseData, clinical_note: er.clinical_note };
        }
      } catch (engineErr) {
        // If clinical engine fails, continue with current state (graceful degradation)
        console.error("Clinical engine error (non-fatal):", engineErr);
      }
    }

    // ─── Persist state ──────────────────────────────────────────
    flags._triggered_actions = triggeredActions as unknown as boolean;
    flags._triggered_events = triggeredEvents as unknown as boolean;

    const sessionUpdate: Record<string, unknown> = {
      elapsed_minutes: elapsedMinutes,
      unlocked_disclosures: unlockedDisclosures,
      patient_state: patientState,
      differential_history: differentialHistory,
      management_plan: managementPlan,
      scoring,
      flags,
      updated_at: new Date().toISOString(),
    };

    if (actionType === "end_case") {
      sessionUpdate.status = "completed";
      sessionUpdate.phase = "completed";
      sessionUpdate.completed_at = new Date().toISOString();
    } else if (session.status === "created") {
      sessionUpdate.status = "in_progress";
      sessionUpdate.phase = "active_encounter";
      if (!session.started_at) sessionUpdate.started_at = new Date().toISOString();
    }

    if (actionType === "submit_diagnosis") {
      sessionUpdate.final_diagnosis = {
        diagnosis: payload.diagnosis ?? "",
        reasoning: payload.reasoning ?? "",
      };
    }

    await db.from("case_sessions").update(sessionUpdate).eq("id", sessionId);

    // Log the action
    await db.from("session_actions").insert({
      session_id: sessionId,
      actor: "student",
      action_type: actionTypeDb,
      target: payload.testId ?? payload.treatment ?? payload.content?.slice(0, 100) ?? null,
      payload: payload as Record<string, unknown>,
      response: responseData,
      elapsed_minutes: elapsedMinutes,
    });

    // ─── Build response ──────────────────────────────────────────
    const result: Record<string, unknown> = {
      ...responseData,
      current_time_minutes: elapsedMinutes,
      phase: sessionUpdate.phase ?? session.phase,
      unlocked_disclosures: unlockedDisclosures,
      newly_unlocked: newlyUnlocked,
    };

    if (deteriorationMessages.length > 0) {
      result.deterioration_events = deteriorationMessages;
    }

    return json(result);
  } catch (err) {
    console.error("Orchestrator error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
