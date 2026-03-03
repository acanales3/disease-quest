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
    differential?: Array<{
      diagnosis: string;
      likelihood: string;
      reasoning?: string;
    }>;
    diagnosis?: string;
    reasoning?: string;
    minutes?: number;
  };
}

// ── Helper: call another edge function ──────────────────────────
async function callAgent(
  fnName: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

  // Some environments don't expose JWT keys to edge runtime.
  // If no JWT is available, call without auth headers (functions are deployed with --no-verify-jwt).
  const candidateTokens = [serviceKey, anonKey].filter((t) =>
    typeof t === "string" && t.split(".").length === 3
  );
  const requests: Array<Record<string, string>> = [];
  for (const token of candidateTokens) {
    requests.push({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: token,
    });
  }
  if (requests.length === 0) {
    requests.push({ "Content-Type": "application/json" });
  }

  let lastStatus = 500;
  let lastErrText = "Unknown error";

  for (const headers of requests) {
    const res = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (res.ok) return res.json();

    lastStatus = res.status;
    lastErrText = await res.text();
    if (res.status !== 401 && res.status !== 403) break;
  }

  throw new Error(`Agent ${fnName} failed (${lastStatus}): ${lastErrText}`);
}

// ── Helper: check disclosure unlocks ────────────────────────────
function checkDisclosureUnlocks(
  disclosures: Array<Record<string, unknown>>,
  unlocked: string[],
  elapsedMinutes: number,
  triggeredActions: string[],
  triggeredEvents: string[],
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
          if (timeMatch && elapsedMinutes >= parseInt(timeMatch[1]))
            shouldUnlock = true;
        }
        break;

      case "ACTION":
        if (unlock.condition) {
          // Check if relevant actions triggered
          if (triggeredActions.some((a) => unlock.condition!.includes(a)))
            shouldUnlock = true;
        }
        break;

      case "ACTION_OR_TIME":
      case "ACTION_OR_STAGE":
      case "TIME_OR_ACTION": {
        if (unlock.condition) {
          // Check time component
          const timeMatch = unlock.condition.match(/time\s*>=\s*(\d+)/);
          if (timeMatch && elapsedMinutes >= parseInt(timeMatch[1]))
            shouldUnlock = true;
          // Check action component
          if (triggeredActions.some((a) => unlock.condition!.includes(a)))
            shouldUnlock = true;
        }
        break;
      }

      case "STATE":
        if (unlock.condition) {
          const timeMatch = unlock.condition.match(/time\s*>=\s*(\d+)/);
          if (timeMatch && elapsedMinutes >= parseInt(timeMatch[1]))
            shouldUnlock = true;
          if (triggeredActions.some((a) => unlock.condition!.includes(a)))
            shouldUnlock = true;
        }
        break;

      case "EVENT":
        if (unlock.condition) {
          if (triggeredEvents.some((e) => unlock.condition!.includes(e)))
            shouldUnlock = true;
        }
        break;
    }

    if (shouldUnlock) newlyUnlocked.push(id);
  }

  return newlyUnlocked;
}

// ── Helper: generic condition evaluator ──────────────────────────
// Parses condition strings like "flag_name == false AND time >= 5"
// from the case content's deterioration_rules. Works with ANY case.
function evaluateCondition(
  condition: string,
  flags: Record<string, boolean>,
  elapsedMinutes: number,
): boolean {
  const clauses = condition.split(/\s+AND\s+/i);

  for (const clause of clauses) {
    const trimmed = clause.trim();

    const timeMatch = trimmed.match(/time\s*>=\s*(\d+)/);
    if (timeMatch) {
      if (elapsedMinutes < parseInt(timeMatch[1])) return false;
      continue;
    }

    const flagFalseMatch = trimmed.match(/(\w+)\s*==\s*false/);
    if (flagFalseMatch) {
      if (flags[flagFalseMatch[1]]) return false;
      continue;
    }

    const flagTrueMatch = trimmed.match(/(\w+)\s*==\s*true/);
    if (flagTrueMatch) {
      if (!flags[flagTrueMatch[1]]) return false;
      continue;
    }
  }

  return true;
}

// ── Helper: check deterioration rules (generic) ─────────────────
function checkDeteriorationRules(
  rules: Array<Record<string, unknown>>,
  flags: Record<string, boolean>,
  elapsedMinutes: number,
  triggeredEvents: string[],
): Array<{ event: string; notes: string; rule: Record<string, unknown> }> {
  const newEvents: Array<{
    event: string;
    notes: string;
    rule: Record<string, unknown>;
  }> = [];

  for (const rule of rules) {
    const condition = (rule.if ?? "") as string;
    const then = (rule.then ?? {}) as { event: string; notes: string };

    if (triggeredEvents.includes(then.event)) continue;

    if (evaluateCondition(condition, flags, elapsedMinutes)) {
      newEvents.push({ ...then, rule });
    }
  }

  return newEvents;
}

// ── Helper: apply deterioration to patient state (generic) ──────
// Reads optional `effects` from the rule; falls back to generic
// severity escalation when effects are not defined.
function applyDeterioration(
  patientState: Record<string, unknown>,
  _event: string,
  rule?: Record<string, unknown>,
): Record<string, unknown> {
  const ps = { ...patientState };
  const physiology = { ...(ps.physiology as Record<string, unknown>) };
  const vitals = { ...(physiology.vitals as Record<string, unknown>) };

  const thenBlock = (rule?.then ?? {}) as Record<string, unknown>;
  const effects = thenBlock.effects as Record<string, unknown> | undefined;

  if (effects) {
    const vitalEffects = effects.vitals as Record<string, unknown> | undefined;
    if (vitalEffects) {
      for (const [k, v] of Object.entries(vitalEffects)) vitals[k] = v;
    }
    if (effects.mental_status) physiology.mental_status = effects.mental_status;
    const boolFlags = effects.flags as Record<string, boolean> | undefined;
    if (boolFlags) {
      for (const [k, v] of Object.entries(boolFlags)) physiology[k] = v;
    }
  } else {
    // Generic severity escalation
    vitals.hr_bpm = Math.min(((vitals.hr_bpm as number) ?? 120) + 15, 220);
    vitals.temp_f = Math.min(((vitals.temp_f as number) ?? 100) + 0.5, 106);
    vitals.bp_systolic = Math.max(
      ((vitals.bp_systolic as number) ?? 90) - 15,
      40,
    );
    vitals.bp_diastolic = Math.max(
      ((vitals.bp_diastolic as number) ?? 60) - 10,
      20,
    );
    vitals.spo2_percent = Math.max(
      ((vitals.spo2_percent as number) ?? 98) - 5,
      70,
    );
    const statusOrder = [
      "alert",
      "drowsy",
      "lethargic",
      "obtunded",
      "stuporous",
      "comatose",
    ];
    const currentIdx = statusOrder.indexOf(
      (physiology.mental_status as string) ?? "alert",
    );
    if (currentIdx >= 0 && currentIdx < statusOrder.length - 1) {
      physiology.mental_status = statusOrder[currentIdx + 1];
    }
  }

  physiology.vitals = vitals;
  ps.physiology = physiology;
  ps.emotional_state = "distressed";
  return ps;
}

// ── Treatment category keywords (universal medical categories) ──
const TREATMENT_CATEGORIES: Record<string, string[]> = {
  antibiotics: [
    "antibiotic",
    "antimicrobial",
    "empiric",
    "ceftriaxone",
    "vancomycin",
    "ampicillin",
    "penicillin",
    "meropenem",
    "cefotaxime",
    "gentamicin",
    "amoxicillin",
    "azithromycin",
    "ciprofloxacin",
    "metronidazole",
    "piperacillin",
    "tazobactam",
    "doxycycline",
    "linezolid",
    "clindamycin",
    "cephalosporin",
    "carbapenem",
    "fluoroquinolone",
    "acyclovir",
    "antiviral",
    "fluconazole",
    "amphotericin",
    "antifungal",
    "trimethoprim",
    "sulfamethoxazole",
  ],
  fluids: [
    "fluid",
    "bolus",
    "saline",
    "lactated ringer",
    "crystalloid",
    "colloid",
    "albumin",
    "normal saline",
    "resuscitat",
    "volume expan",
  ],
  vasopressors: [
    "dopamine",
    "epinephrine",
    "norepinephrine",
    "vasopressor",
    "vasopressin",
    "phenylephrine",
    "dobutamine",
    "milrinone",
    "inotrope",
    "pressor",
  ],
  airway: [
    "intubat",
    "ventilat",
    "mechanical ventilation",
    "cpap",
    "bipap",
    "high flow",
    "nasal cannula",
    "airway management",
  ],
  anticonvulsant: [
    "diazepam",
    "lorazepam",
    "midazolam",
    "phenytoin",
    "fosphenytoin",
    "levetiracetam",
    "phenobarbital",
    "benzodiazepine",
    "anticonvuls",
    "antiepileptic",
    "valproate",
    "seizure",
  ],
  anti_inflammatory: [
    "dexamethasone",
    "methylprednisolone",
    "prednisolone",
    "prednisone",
    "hydrocortisone",
    "steroid",
    "corticosteroid",
  ],
};

// ── Helper: classify treatment into a category ──────────────────
function classifyTreatment(
  treatmentText: string,
  caseInterventions: Array<Record<string, unknown>>,
): string {
  const lower = treatmentText.toLowerCase();

  // First: match against case-defined interventions (most specific)
  for (const intervention of caseInterventions) {
    const category = (intervention.category ?? "") as string;
    if (!category) continue;
    const options = ((intervention.options ?? []) as string[]).map((o) =>
      o.toLowerCase(),
    );
    if (options.some((opt) => lower.includes(opt))) return category;
  }

  // Second: match against universal keyword categories
  for (const [category, keywords] of Object.entries(TREATMENT_CATEGORIES)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }

  return "unknown";
}

type BedsideTone = "empathetic" | "neutral" | "abrasive";

const MENTAL_STATUS_ORDER = [
  "alert",
  "drowsy",
  "lethargic",
  "obtunded",
  "stuporous",
  "comatose",
];

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function worsenMentalStatus(current: unknown): string {
  const idx = MENTAL_STATUS_ORDER.indexOf(String(current ?? "alert"));
  if (idx < 0) return "drowsy";
  return MENTAL_STATUS_ORDER[Math.min(idx + 1, MENTAL_STATUS_ORDER.length - 1)];
}

function assessBedsideManner(question: string): BedsideTone {
  const q = question.toLowerCase();
  const empatheticSignals = [
    "please",
    "thank you",
    "i understand",
    "i'm sorry",
    "im sorry",
    "that sounds hard",
    "we're here to help",
    "can you tell me",
    "take your time",
  ];
  const abrasiveSignals = [
    "hurry",
    "just answer",
    "whatever",
    "stop crying",
    "calm down",
    "be quiet",
    "that's irrelevant",
    "quick answer",
  ];

  const empatheticHits = empatheticSignals.filter((s) => q.includes(s)).length;
  const abrasiveHits = abrasiveSignals.filter((s) => q.includes(s)).length;

  if (empatheticHits > abrasiveHits) return "empathetic";
  if (abrasiveHits > empatheticHits) return "abrasive";
  return "neutral";
}

function findInterventionDefinition(
  treatmentText: string,
  caseInterventions: Array<Record<string, unknown>>,
): Record<string, unknown> | null {
  const lower = treatmentText.toLowerCase().trim();
  if (!lower) return null;

  for (const intervention of caseInterventions) {
    const displayName = String(intervention.display_name ?? "").toLowerCase();
    const options = ((intervention.options ?? []) as string[]).map((o) =>
      String(o).toLowerCase(),
    );

    if (displayName && (displayName === lower || lower.includes(displayName))) {
      return intervention;
    }

    if (
      options.some((opt) => opt && (opt === lower || lower.includes(opt)))
    ) {
      return intervention;
    }
  }

  return null;
}

function applyUnsafeTreatmentEffect(
  patientState: Record<string, unknown>,
  treatmentCategory: string,
  adverseEffectRisk?: string,
): { patientState: Record<string, unknown>; eventNote: string } {
  const ps = { ...patientState };
  const physiology = { ...(ps.physiology as Record<string, unknown>) };
  const vitals = { ...(physiology.vitals as Record<string, unknown>) };
  let note = "Possible iatrogenic complication after unsafe intervention.";

  if (treatmentCategory === "vasopressors") {
    vitals.hr_bpm = clampNumber(toNumber(vitals.hr_bpm, 120) + 18, 30, 220);
    vitals.bp_systolic = clampNumber(
      toNumber(vitals.bp_systolic, 90) + 20,
      35,
      220,
    );
    vitals.bp_diastolic = clampNumber(
      toNumber(vitals.bp_diastolic, 60) + 12,
      20,
      130,
    );
    note = "Possible catecholamine overshoot causing tachycardia/hypertension.";
  } else if (treatmentCategory === "fluids") {
    vitals.rr_bpm = clampNumber(toNumber(vitals.rr_bpm, 20) + 6, 6, 55);
    vitals.spo2_percent = clampNumber(
      toNumber(vitals.spo2_percent, 96) - 4,
      55,
      100,
    );
    vitals.cap_refill_sec = clampNumber(
      toNumber(vitals.cap_refill_sec, 2.5) + 0.4,
      0.5,
      10,
    );
    note = "Possible fluid overload with new respiratory distress.";
  } else if (treatmentCategory === "airway") {
    vitals.bp_systolic = clampNumber(
      toNumber(vitals.bp_systolic, 90) - 12,
      35,
      220,
    );
    vitals.bp_diastolic = clampNumber(
      toNumber(vitals.bp_diastolic, 60) - 8,
      20,
      130,
    );
    vitals.hr_bpm = clampNumber(toNumber(vitals.hr_bpm, 110) + 8, 30, 220);
    physiology.mental_status = worsenMentalStatus(physiology.mental_status);
    note = "Sedation/intubation complication with hypotension.";
  } else if (treatmentCategory === "anticonvulsant") {
    vitals.rr_bpm = clampNumber(toNumber(vitals.rr_bpm, 20) - 4, 6, 55);
    vitals.spo2_percent = clampNumber(
      toNumber(vitals.spo2_percent, 96) - 3,
      55,
      100,
    );
    physiology.mental_status = worsenMentalStatus(physiology.mental_status);
    note = "Medication over-sedation with depressed respirations.";
  } else {
    vitals.hr_bpm = clampNumber(toNumber(vitals.hr_bpm, 110) + 12, 30, 220);
    vitals.bp_systolic = clampNumber(
      toNumber(vitals.bp_systolic, 90) - 10,
      35,
      220,
    );
    vitals.spo2_percent = clampNumber(
      toNumber(vitals.spo2_percent, 96) - 2,
      55,
      100,
    );
    const skinFindings = Array.isArray(physiology.skin_findings)
      ? [...(physiology.skin_findings as string[])]
      : [];
    if (!skinFindings.includes("new urticarial rash")) {
      skinFindings.push("new urticarial rash");
    }
    physiology.skin_findings = skinFindings;
    note = "Possible adverse drug reaction with hemodynamic instability.";
  }

  if (
    toNumber(vitals.spo2_percent, 100) <= 90 ||
    toNumber(vitals.rr_bpm, 20) >= 30
  ) {
    physiology.has_respiratory_failure = true;
  }

  if (adverseEffectRisk && adverseEffectRisk !== "null") {
    note = adverseEffectRisk;
  }

  physiology.vitals = vitals;
  ps.physiology = physiology;
  return { patientState: ps, eventNote: note };
}

// ── Helper: apply treatment to patient state (generic) ──────────
function applyTreatment(
  patientState: Record<string, unknown>,
  treatment: string,
  caseInterventions: Array<Record<string, unknown>>,
): Record<string, unknown> {
  const ps = { ...patientState };
  const physiology = { ...(ps.physiology as Record<string, unknown>) };
  const vitals = { ...(physiology.vitals as Record<string, unknown>) };
  const category = classifyTreatment(treatment, caseInterventions);

  switch (category) {
    case "antibiotics":
      physiology.antibiotics_started = true;
      vitals.hr_bpm = Math.max(((vitals.hr_bpm as number) ?? 150) - 20, 100);
      vitals.temp_f = Math.max(((vitals.temp_f as number) ?? 102) - 0.5, 98.6);
      break;

    case "fluids":
      physiology.fluids_given = true;
      vitals.bp_systolic = Math.min(
        ((vitals.bp_systolic as number) ?? 80) + 15,
        120,
      );
      vitals.bp_diastolic = Math.min(
        ((vitals.bp_diastolic as number) ?? 50) + 10,
        80,
      );
      vitals.cap_refill_sec = Math.max(
        ((vitals.cap_refill_sec as number) ?? 4) - 1,
        2,
      );
      vitals.hr_bpm = Math.max(((vitals.hr_bpm as number) ?? 150) - 15, 80);
      break;

    case "vasopressors":
      physiology.vasopressors_started = true;
      vitals.bp_systolic = Math.min(
        ((vitals.bp_systolic as number) ?? 60) + 25,
        110,
      );
      vitals.bp_diastolic = Math.min(
        ((vitals.bp_diastolic as number) ?? 40) + 15,
        70,
      );
      vitals.cap_refill_sec = Math.max(
        ((vitals.cap_refill_sec as number) ?? 5) - 2,
        2,
      );
      vitals.hr_bpm = Math.max(((vitals.hr_bpm as number) ?? 150) - 25, 80);
      physiology.has_shock = false;
      break;

    case "anti_inflammatory":
      physiology.dexamethasone_given = true;
      vitals.temp_f = Math.max(((vitals.temp_f as number) ?? 102) - 1, 98.6);
      vitals.hr_bpm = Math.max(((vitals.hr_bpm as number) ?? 150) - 10, 80);
      break;

    case "airway":
      physiology.is_intubated = true;
      physiology.has_respiratory_failure = false;
      vitals.spo2_percent = 98;
      vitals.rr_bpm = 20;
      break;

    case "anticonvulsant":
      physiology.has_seizure = false;
      vitals.hr_bpm = Math.max(((vitals.hr_bpm as number) ?? 150) - 20, 80);
      if (physiology.mental_status === "obtunded") {
        physiology.mental_status = "lethargic";
      }
      break;
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
    const { sessionId, actionType, payload }: OrchestratorRequest =
      await req.json();

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
    const disclosures = (caseContent.disclosures ?? []) as Array<
      Record<string, unknown>
    >;
    const diagnosticTests = (caseContent.diagnostic_tests ?? []) as Array<
      Record<string, unknown>
    >;
    const testResults = (caseContent.test_results ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    const deteriorationRules = (caseContent.deterioration_rules ?? []) as Array<
      Record<string, unknown>
    >;

    // Session state
    let patientState = (session.patient_state ??
      caseContent.initial_patient_state ??
      {}) as Record<string, unknown>;
    let unlockedDisclosures: string[] = session.unlocked_disclosures ?? [];
    let elapsedMinutes: number = session.elapsed_minutes ?? 0;
    let flags = (session.flags ?? {}) as Record<string, boolean>;
    let differentialHistory = (session.differential_history ?? []) as Array<
      Record<string, unknown>
    >;
    let managementPlan = (session.management_plan ?? []) as string[];
    let scoring = (session.scoring ?? {}) as Record<string, unknown>;
    const triggeredActions: string[] =
      (flags._triggered_actions as unknown as string[]) ?? [];
    const triggeredEvents: string[] =
      (flags._triggered_events as unknown as string[]) ?? [];

    // Load conversation history
    const { data: messages } = await db
      .from("session_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(50);

    const conversationHistory = (messages ?? []) as Array<{
      role: string;
      content: string;
    }>;

    // Load ordered tests from actions (order data is in the response field)
    const { data: testOrderActions } = await db
      .from("session_actions")
      .select("target, payload, response, elapsed_minutes")
      .eq("session_id", sessionId)
      .eq("action_type", "order_test");

    const orderedTests: Record<
      string,
      { testId: string; orderedAt: number; resultAvailableAt: number }
    > = {};
    for (const a of testOrderActions ?? []) {
      const tid = a.target as string;
      if (!tid) continue;
      // Try to get order data from response (where diagnostic-agent puts it)
      const resp = (a.response ?? {}) as Record<string, unknown>;
      if (resp.order) {
        orderedTests[tid] = resp.order as {
          testId: string;
          orderedAt: number;
          resultAvailableAt: number;
        };
      } else if (resp.ordered_at !== undefined) {
        // Fallback: reconstruct from response fields
        const testDef = diagnosticTests.find((t) => String(t.id ?? "") === String(tid));
        const defaultTat = Number(testDef?.tat_minutes ?? testDef?.turnaround_time_minutes ?? 30);
        const orderedAt = (resp.ordered_at ?? a.elapsed_minutes ?? 0) as number;
        orderedTests[tid] = {
          testId: tid,
          orderedAt,
          resultAvailableAt: (resp.expected_result_at ?? orderedAt + defaultTat) as number,
        };
      } else {
        // Last resort: use action timestamp + test TAT from case definition
        const testDef = diagnosticTests.find((t) => String(t.id ?? "") === String(tid));
        const defaultTat = Number(testDef?.tat_minutes ?? testDef?.turnaround_time_minutes ?? 30);
        const orderedAt = (a.elapsed_minutes ?? 0) as number;
        orderedTests[tid] = {
          testId: tid,
          orderedAt,
          resultAvailableAt: orderedAt + defaultTat,
        };
      }
    }

    let responseData: Record<string, unknown> = {};
    let actionTypeDb = actionType.replace(/_/g, "_");
    const runtimeNotices: string[] = [];

    // ─── Route to agent ──────────────────────────────────────────

    if (actionType === "ask_patient") {
      const studentQuestion = String(payload.content ?? "");
      const bedsideTone = assessBedsideManner(studentQuestion);
      if (bedsideTone === "empathetic") {
        patientState.cooperation_level = "open and cooperative";
        patientState.emotional_state =
          "anxious but reassured by the team's communication";
        triggeredActions.push("empathetic_communication");
      } else if (bedsideTone === "abrasive") {
        patientState.cooperation_level = "guarded and hesitant";
        patientState.emotional_state = "frustrated and fearful";
        flags.communication_concerns = true;
        triggeredActions.push("abrasive_communication");
        runtimeNotices.push(
          "Family trust decreased due to poor bedside communication.",
        );
      }

      responseData = await callAgent("patient-agent", {
        question: studentQuestion,
        patientState,
        unlockedDisclosures,
        disclosures,
        conversationHistory,
        elapsedMinutes,
        interactionTone: bedsideTone,
      });

      // Save messages
      await db.from("session_messages").insert([
        {
          session_id: sessionId,
          role: "student",
          content: payload.content ?? "",
        },
        {
          session_id: sessionId,
          role: "patient",
          content: (responseData as Record<string, unknown>).response ?? "",
        },
      ]);

      actionTypeDb = "ask";
    } else if (actionType === "perform_exam") {
      triggeredActions.push("student_requests_exam");
      const physiology = (patientState.physiology ?? {}) as Record<
        string,
        unknown
      >;
      const vitals = (physiology.vitals ?? {}) as Record<string, unknown>;

      const mentalStatusDescriptions: Record<string, string> = {
        alert: "Alert and oriented, appropriate affect",
        drowsy: "Drowsy but arousable, responds to verbal stimuli",
        lethargic: "Lethargic, minimally responsive to stimulation",
        obtunded: "Obtunded, responds only to vigorous stimulation",
        stuporous: "Stuporous, minimal response to painful stimuli",
        comatose: "Unresponsive, no purposeful movements",
      };
      const currentStatus = (physiology.mental_status ?? "unknown") as string;

      responseData = {
        type: "exam_findings",
        exam_type: payload.content ?? "complete",
        findings: {
          general_appearance:
            mentalStatusDescriptions[currentStatus] ??
            `Mental status: ${currentStatus}`,
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
    } else if (actionType === "order_test") {
      const testId = payload.testId ?? payload.content ?? "";
      const orderedTestDef =
        diagnosticTests.find((t) => String(t.id ?? "") === String(testId)) ??
        null;
      const clinicalValue = String(orderedTestDef?.clinical_value ?? "");

      // Track cultures ordered before antibiotics (generic — any culture test)
      if (testId.includes("culture") && !flags.antibiotics_ordered) {
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
        // Also push a normalized version for disclosure unlock matching
        const normalizedAction = `student_orders_${testId.replace(/_/g, "_")}`;
        if (!triggeredActions.includes(normalizedAction)) {
          triggeredActions.push(normalizedAction);
        }
        if ((responseData as Record<string, unknown>).order) {
          orderedTests[testId] = (responseData as Record<string, unknown>)
            .order as {
            testId: string;
            orderedAt: number;
            resultAvailableAt: number;
          };
        }

        if (
          clinicalValue === "low_yield_distractor" ||
          clinicalValue === "inappropriate"
        ) {
          triggeredActions.push("student_orders_low_value_test");
          flags.resource_inefficiency = true;
          // No automatic time penalty — resource score is penalized at evaluation instead.
          // Stealth physiological cost only (mild), flagged for evaluator scoring.
          const warning =
            clinicalValue === "inappropriate"
              ? "This order has limited clinical indication for the current presentation."
              : "This test has low yield for the current clinical picture.";
          runtimeNotices.push(warning);
        }
      }
      actionTypeDb = "order_test";
    } else if (actionType === "get_results") {
      const testId = payload.testId ?? payload.content ?? "";
      // Client sends its real-time elapsed minutes (ticking every second).
      // Use it if it's ahead of the DB value so results unlock on real time, not sync lag.
      const clientElapsed = typeof payload.clientElapsedMinutes === "number"
        ? payload.clientElapsedMinutes
        : 0;
      const effectiveElapsed = Math.max(elapsedMinutes, clientElapsed);

      responseData = await callAgent("diagnostic-agent", {
        action: "get_results",
        testId,
        elapsedMinutes: effectiveElapsed,
        diagnosticTests,
        testResults,
        orderedTests,
      });

      if ((responseData as Record<string, unknown>).status === "complete") {
        triggeredActions.push(`student_reviews_${testId}`);
        // Push a normalized review action for disclosure matching
        const normalizedReview = `student_reviews_${testId.replace(/_/g, "_")}_results`;
        if (!triggeredActions.includes(normalizedReview)) {
          triggeredActions.push(normalizedReview);
        }
      }
      actionTypeDb = "interpret";
    } else if (actionType === "administer_treatment") {
      const treatment = payload.treatment ?? payload.content ?? "";
      const caseInterventions = (caseContent.interventions ?? []) as Array<
        Record<string, unknown>
      >;
      const interventionDef = findInterventionDefinition(
        String(treatment),
        caseInterventions,
      );
      const appropriateness = String(
        interventionDef?.appropriateness ?? "unknown",
      );
      const adverseEffectRisk = String(
        interventionDef?.adverse_effect_risk ?? "",
      );
      const treatmentCategory = classifyTreatment(treatment, caseInterventions);
      patientState = applyTreatment(patientState, treatment, caseInterventions);

      // Set flags dynamically based on treatment category
      if (treatmentCategory === "antibiotics") {
        flags.antibiotics_ordered = true;
        flags.antibiotics_started = true;
        triggeredActions.push("antibiotics_started");
      }
      if (
        treatmentCategory === "vasopressors" ||
        treatmentCategory === "fluids"
      ) {
        flags.shock_addressed = true;
      }
      if (treatmentCategory === "anticonvulsant") {
        flags.seizure_addressed = true;
      }
      if (treatmentCategory === "airway") {
        flags.airway_addressed = true;
      }
      triggeredActions.push(`treatment_${treatmentCategory}`);

      if (!managementPlan.includes(treatment as string)) {
        managementPlan.push(treatment as string);
      }

      if (appropriateness === "potentially_harmful") {
        const harmed = applyUnsafeTreatmentEffect(
          patientState,
          treatmentCategory,
          adverseEffectRisk,
        );
        patientState = harmed.patientState;
        flags.patient_safety_compromised = true;
        flags.iatrogenic_event = true;
        triggeredActions.push("unsafe_treatment_selected");
        runtimeNotices.push(`Adverse effect risk realized: ${harmed.eventNote}`);
      } else if (appropriateness === "unnecessary") {
        flags.resource_inefficiency = true;
        triggeredActions.push("unnecessary_treatment_selected");
        // No automatic time penalty — penalised via scoring at end of case.
        runtimeNotices.push(
          "This intervention is unlikely to benefit the patient given the current clinical picture.",
        );
      }

      // Build response message based on physiological effects
      const physiology = (patientState.physiology ?? {}) as Record<
        string,
        unknown
      >;
      const vitals = (physiology.vitals ?? {}) as Record<string, unknown>;
      const statusUpdate: string[] = [];
      if (appropriateness === "potentially_harmful") {
        statusUpdate.push("Potential iatrogenic adverse effect noted");
      } else if (appropriateness === "unnecessary") {
        statusUpdate.push("Likely low-value intervention");
      }
      if (vitals.bp_systolic)
        statusUpdate.push(
          `BP now ${vitals.bp_systolic}/${vitals.bp_diastolic}`,
        );
      if (
        physiology.has_shock === false &&
        treatmentCategory === "vasopressors"
      )
        statusUpdate.push("Shock resolving");
      if (
        physiology.has_seizure === false &&
        treatmentCategory === "anticonvulsant"
      )
        statusUpdate.push("Seizure aborted");
      if (physiology.is_intubated === true && treatmentCategory === "airway")
        statusUpdate.push("Patient intubated, SpO2 improving");

      responseData = {
        type: "treatment_administered",
        treatment,
        category: treatmentCategory,
        appropriateness,
        message: `${treatment} has been administered.${statusUpdate.length ? " " + statusUpdate.join(". ") + "." : ""}`,
        patient_response: "Treatment administered. Monitor for response.",
      };
      actionTypeDb = "administer";
    } else if (actionType === "consult_tutor") {
      responseData = await callAgent("tutor-agent", {
        question: payload.content ?? "",
        caseContent,
        sessionContext: {
          elapsedMinutes,
          phase: session.phase,
          differential:
            differentialHistory.length > 0
              ? ((
                  differentialHistory[differentialHistory.length - 1] as Record<
                    string,
                    unknown
                  >
                ).diagnoses ?? [])
              : [],
          testsOrdered: Object.keys(orderedTests),
          testResults: [],
          treatmentsGiven: managementPlan,
          vitals:
            ((patientState.physiology ?? {}) as Record<string, unknown>)
              .vitals ?? {},
          patientStatus: {
            has_shock:
              ((patientState.physiology ?? {}) as Record<string, unknown>)
                .has_shock ?? false,
            has_seizure:
              ((patientState.physiology ?? {}) as Record<string, unknown>)
                .has_seizure ?? false,
            mental_status:
              ((patientState.physiology ?? {}) as Record<string, unknown>)
                .mental_status ?? "unknown",
          },
          conversationHistory,
        },
      });

      await db.from("session_messages").insert([
        {
          session_id: sessionId,
          role: "student",
          content: `[To Tutor] ${payload.content ?? ""}`,
        },
        {
          session_id: sessionId,
          role: "tutor",
          content: (responseData as Record<string, unknown>).response ?? "",
        },
      ]);
      actionTypeDb = "consult";
    } else if (actionType === "update_differential") {
      const differential = payload.differential ?? [];
      differentialHistory.push({
        timestamp_minutes: elapsedMinutes,
        diagnoses: differential,
      });

      // Check if the student's DDx includes the correct diagnosis
      // Extract key diagnostic terms from correct_diagnosis for matching
      const correctDiagnosis = (
        (caseContent.correct_diagnosis ?? "") as string
      ).toLowerCase();
      const diagnosisKeywords = correctDiagnosis
        .split(/[\s,—–\-()\/]+/)
        .filter((w) => w.length > 3)
        .filter(
          (w) =>
            ![
              "acute",
              "chronic",
              "with",
              "due",
              "from",
              "type",
              "stage",
            ].includes(w),
        );

      for (const dx of differential) {
        const dxLower = ((dx.diagnosis ?? "") as string).toLowerCase();
        const matchesCorrect = diagnosisKeywords.some((keyword) =>
          dxLower.includes(keyword),
        );
        if (matchesCorrect && !flags.correct_diagnosis_suspected) {
          flags.correct_diagnosis_suspected = true;
          // Also set a case-specific flag using the first significant keyword
          const primaryKeyword = diagnosisKeywords[0] ?? "diagnosis";
          flags[`${primaryKeyword}_suspected`] = true;
          triggeredActions.push(`student_flags_${primaryKeyword}`);
          triggeredActions.push("student_suspects_correct_diagnosis");
          break;
        }
      }

      responseData = {
        type: "differential_updated",
        differential,
        message: "Differential diagnosis updated.",
      };
      actionTypeDb = "differential";
    } else if (actionType === "submit_diagnosis") {
      responseData = {
        type: "diagnosis_recorded",
        diagnosis: payload.diagnosis ?? "",
        message:
          "Final diagnosis recorded. You can continue managing the patient or end the case for evaluation.",
      };
      actionTypeDb = "diagnose";
    } else if (actionType === "advance_time") {
      const minutes = Number(payload.minutes ?? 5);
      // If the client sends its current real-time elapsed, use the max of
      // (db + minutes) and client value — prevents double-counting.
      const clientElapsed = typeof payload.clientElapsedMinutes === "number"
        ? payload.clientElapsedMinutes
        : 0;
      elapsedMinutes = Math.max(elapsedMinutes + minutes, clientElapsed);
      responseData = {
        type: "time_advanced",
        elapsed_minutes: elapsedMinutes,
        message: `T+${elapsedMinutes} min`,
      };
      actionTypeDb = "note";
    } else if (actionType === "end_case") {
      // Call evaluator
      const evalResult = await callAgent("evaluator-agent", {
        caseContent,
        sessionData: {
          elapsedMinutes,
          finalDiagnosis:
            (session.final_diagnosis as Record<string, unknown>)?.diagnosis ??
            payload.diagnosis ??
            null,
          finalDiagnosisReasoning:
            (session.final_diagnosis as Record<string, unknown>)?.reasoning ??
            payload.reasoning ??
            null,
          differentialHistory,
          testOrders: Object.entries(orderedTests).map(([tid, o]) => ({
            testId: tid,
            orderedAt: o.orderedAt,
            hasResults: elapsedMinutes >= o.resultAvailableAt,
          })),
          actionLog:
            (
              await db
                .from("session_actions")
                .select(
                  "actor, action_type, target, payload, response, elapsed_minutes",
                )
                .eq("session_id", sessionId)
                .order("created_at", { ascending: true })
            ).data ?? [],
          conversationHistory,
          flags,
          treatmentsAdministered: managementPlan,
        },
      });

      // Write evaluation to evaluations table
      const dbScores = (evalResult as Record<string, unknown>)
        .db_scores as Record<string, number | null>;
      console.log(
        "[ORCHESTRATOR] dbScores from evaluator:",
        JSON.stringify(dbScores),
      );

      if (dbScores && Object.keys(dbScores).length > 0) {
        const evalPayload = {
          user_id: session.user_id,
          case_id: session.case_id,
          session_id: sessionId, // ← links this evaluation to the specific attempt
          ...dbScores,
          reflection_document: JSON.stringify(
            (evalResult as Record<string, unknown>).evaluation ?? {},
          ),
        };
        console.log(
          "[ORCHESTRATOR] Inserting evaluation:",
          JSON.stringify({
            user_id: evalPayload.user_id, // ← renamed
            case_id: evalPayload.case_id,
            score_keys: Object.keys(dbScores),
          }),
        );

        const { data: evalData, error: evalErr } = await db
          .from("evaluations")
          .insert(evalPayload)
          .select();

        if (evalErr) {
          console.error(
            "[ORCHESTRATOR] EVALUATION INSERT FAILED:",
            evalErr.message,
            evalErr.details,
            evalErr.hint,
          );
        } else {
          console.log(
            "[ORCHESTRATOR] Evaluation saved successfully, id:",
            (evalData as any)?.[0]?.id,
          );
        }
      } else {
        console.error(
          "[ORCHESTRATOR] No dbScores returned from evaluator — skipping evaluation save",
        );
      }

      scoring =
        ((evalResult as Record<string, unknown>).evaluation as Record<
          string,
          unknown
        >) ?? {};

      responseData = {
        type: "case_completed",
        evaluation: (evalResult as Record<string, unknown>).evaluation ?? {},
        db_scores: dbScores ?? {},
        total_score: (evalResult as Record<string, unknown>).total_score ?? 0,
        max_score: (evalResult as Record<string, unknown>).max_score ?? 100,
        percentage: (evalResult as Record<string, unknown>).percentage ?? 0,
      };
      actionTypeDb = "note";
    } else {
      return json({ error: `Unknown action type: ${actionType}` }, 400);
    }

    // ─── Check disclosure unlocks ────────────────────────────────
    const newlyUnlocked = checkDisclosureUnlocks(
      disclosures,
      unlockedDisclosures,
      elapsedMinutes,
      triggeredActions,
      triggeredEvents,
    );
    if (newlyUnlocked.length > 0) {
      unlockedDisclosures = [...unlockedDisclosures, ...newlyUnlocked];
    }

    // ─── Check deterioration events ──────────────────────────────
    const newDetEvents = checkDeteriorationRules(
      deteriorationRules,
      flags,
      elapsedMinutes,
      triggeredEvents,
    );
    const deteriorationMessages: string[] = [];
    for (const evt of newDetEvents) {
      triggeredEvents.push(evt.event);
      patientState = applyDeterioration(patientState, evt.event, evt.rule);
      deteriorationMessages.push(evt.notes);

      // Unlock any event-triggered disclosures
      const eventUnlocks = checkDisclosureUnlocks(
        disclosures,
        unlockedDisclosures,
        elapsedMinutes,
        triggeredActions,
        triggeredEvents,
      );
      if (eventUnlocks.length > 0) {
        unlockedDisclosures = [...unlockedDisclosures, ...eventUnlocks];
      }
    }

    // ─── AI Clinical Engine: dynamic physiology ─────────────────
    // Call the clinical engine to determine realistic vital changes
    // based on the full clinical picture (replaces deterministic rules)
    if (
      actionType !== "end_case" &&
      actionType !== "update_differential" &&
      actionType !== "submit_diagnosis" &&
      actionType !== "get_results"
    ) {
      try {
        const physiology = (patientState.physiology ?? {}) as Record<
          string,
          unknown
        >;
        const vitals = (physiology.vitals ?? {}) as Record<string, unknown>;

        // Build full case context for the clinical engine (all values from case content)
        const initialVitals = (caseContent.initial_vitals ?? {}) as Record<
          string,
          unknown
        >;
        const caseContext = {
          correct_diagnosis: caseContent.correct_diagnosis ?? "Unknown",
          setting: caseContent.setting ?? "Unknown",
          difficulty: caseContent.difficulty ?? "Unknown",
          key_findings: caseContent.key_findings ?? [],
          deterioration_rules: (caseContent.deterioration_rules ?? []) as Array<
            Record<string, unknown>
          >,
          interventions: (
            (caseContent.interventions ?? []) as Array<Record<string, unknown>>
          ).map((i) => ({
            id: i.id,
            name: i.display_name,
            category: i.category,
          })),
          initial_vitals: initialVitals,
          unlocked_disclosure_content: disclosures
            .filter((d) => unlockedDisclosures.includes(d.id as string))
            .map((d) => ({ id: d.id, title: d.title, content: d.content })),
          scoring_categories: caseContent.scoring_categories ?? {},
        };

        const engineResult = await callAgent("clinical-engine", {
          lastAction: {
            type: actionType,
            detail:
              payload.treatment ??
              payload.testId ??
              payload.content ??
              actionType,
          },
          patientState: {
            vitals: {
              hr_bpm: vitals.hr_bpm ?? initialVitals.hr_bpm ?? 100,
              bp_systolic:
                vitals.bp_systolic ?? initialVitals.bp_systolic ?? 90,
              bp_diastolic:
                vitals.bp_diastolic ?? initialVitals.bp_diastolic ?? 60,
              temp_f: vitals.temp_f ?? initialVitals.temp_f ?? 98.6,
              rr_bpm: vitals.rr_bpm ?? initialVitals.rr_bpm ?? 18,
              spo2_percent:
                vitals.spo2_percent ?? initialVitals.spo2_percent ?? 98,
              cap_refill_sec:
                vitals.cap_refill_sec ?? initialVitals.cap_refill_sec ?? 2,
            },
            mental_status: physiology.mental_status ?? "alert",
            has_shock: (physiology.has_shock ?? false) as boolean,
            has_seizure: (physiology.has_seizure ?? false) as boolean,
            has_respiratory_failure: (physiology.has_respiratory_failure ??
              false) as boolean,
            is_intubated: (physiology.is_intubated ?? false) as boolean,
            antibiotics_started: (physiology.antibiotics_started ??
              false) as boolean,
            fluids_given: (physiology.fluids_given ?? false) as boolean,
            vasopressors_started: (physiology.vasopressors_started ??
              false) as boolean,
            dexamethasone_given: (physiology.dexamethasone_given ??
              false) as boolean,
          },
          treatmentsGiven: managementPlan,
          testsOrdered: Object.keys(orderedTests),
          elapsedMinutes,
          caseContext,
          flags,
        });

        // Apply AI-determined vitals, but preserve treatment effects
        const er = engineResult as Record<string, unknown>;
        if (er.vitals) {
          const newVitals = er.vitals as Record<string, unknown>;
          const updatedPhysiology = {
            ...(patientState.physiology as Record<string, unknown>),
          };
          const currentVitals = {
            ...(updatedPhysiology.vitals as Record<string, unknown>),
          };

          // Hard physiological clamps — the patient cannot die
          const clamp = (v: unknown, min: number, max: number) =>
            Math.max(min, Math.min(max, Number(v) || min));
          const maxDelta = (
            newVal: unknown,
            curVal: unknown,
            limit: number,
            floor: number,
            ceil: number,
          ) => {
            const n = Number(newVal) || 0;
            const c = Number(curVal) || 0;
            const clamped = Math.max(floor, Math.min(ceil, n));
            const delta = clamped - c;
            return c + Math.max(-limit, Math.min(limit, delta));
          };

          newVitals.hr_bpm = maxDelta(
            newVitals.hr_bpm,
            currentVitals.hr_bpm,
            15,
            30,
            220,
          );
          newVitals.bp_systolic = maxDelta(
            newVitals.bp_systolic,
            currentVitals.bp_systolic,
            10,
            35,
            220,
          );
          newVitals.bp_diastolic = maxDelta(
            newVitals.bp_diastolic,
            currentVitals.bp_diastolic,
            10,
            20,
            130,
          );
          newVitals.temp_f = maxDelta(
            newVitals.temp_f,
            currentVitals.temp_f,
            0.5,
            92.0,
            107.0,
          );
          newVitals.rr_bpm = maxDelta(
            newVitals.rr_bpm,
            currentVitals.rr_bpm,
            5,
            6,
            55,
          );
          newVitals.spo2_percent = maxDelta(
            newVitals.spo2_percent,
            currentVitals.spo2_percent,
            3,
            55,
            100,
          );
          newVitals.cap_refill_sec = clamp(newVitals.cap_refill_sec, 0.5, 10.0);

          // Only accept AI vitals if they're reasonable improvements when treatments were given
          // If vasopressors/fluids were given, BP must not go LOWER than what deterministic rules set
          if (physiology.vasopressors_started || physiology.fluids_given) {
            newVitals.bp_systolic = Math.max(
              (newVitals.bp_systolic as number) ?? 0,
              (currentVitals.bp_systolic as number) ?? 0,
            );
            newVitals.bp_diastolic = Math.max(
              (newVitals.bp_diastolic as number) ?? 0,
              (currentVitals.bp_diastolic as number) ?? 0,
            );
          }
          // If antibiotics given, HR should not go higher than current
          if (physiology.antibiotics_started) {
            newVitals.hr_bpm = Math.min(
              (newVitals.hr_bpm as number) ?? 999,
              (currentVitals.hr_bpm as number) ?? 999,
            );
          }
          // If intubated, SpO2 must stay >= 95
          if (physiology.is_intubated) {
            newVitals.spo2_percent = Math.max(
              (newVitals.spo2_percent as number) ?? 0,
              95,
            );
          }

          updatedPhysiology.vitals = { ...currentVitals, ...newVitals };

          // Mental status: AI can set it, but if treatments resolve the cause, don't let it worsen
          if (er.mental_status) {
            const statusOrder = [
              "alert",
              "drowsy",
              "lethargic",
              "obtunded",
              "stuporous",
              "comatose",
            ];
            const currentIdx = statusOrder.indexOf(
              updatedPhysiology.mental_status as string,
            );
            const newIdx = statusOrder.indexOf(er.mental_status as string);
            // If vasopressors + fluids + antibiotics are all given, only allow improvement or same
            if (
              physiology.vasopressors_started &&
              physiology.antibiotics_started
            ) {
              if (newIdx <= currentIdx)
                updatedPhysiology.mental_status = er.mental_status;
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

          // If anticonvulsant treatment given, seizure MUST clear
          const treatmentCat =
            actionType === "administer_treatment"
              ? classifyTreatment(
                  payload.treatment ?? "",
                  (caseContent.interventions ?? []) as Array<
                    Record<string, unknown>
                  >,
                )
              : "";
          if (treatmentCat === "anticonvulsant") {
            updatedPhysiology.has_seizure = false;
          } else if (er.has_seizure !== undefined) {
            updatedPhysiology.has_seizure = er.has_seizure;
          }

          // If intubated, respiratory failure MUST clear
          if (physiology.is_intubated) {
            updatedPhysiology.has_respiratory_failure = false;
          } else if (er.has_respiratory_failure !== undefined) {
            updatedPhysiology.has_respiratory_failure =
              er.has_respiratory_failure;
          }

          patientState = { ...patientState, physiology: updatedPhysiology };
        }

        // Handle new clinical events from the engine
        if (er.new_event && typeof er.new_event === "string") {
          const eventLower = (er.new_event as string).toLowerCase();
          const isShockEvent = eventLower.includes("shock");
          const isSeizureEvent = eventLower.includes("seizure");

          // Don't trigger events that are already being treated
          if (isShockEvent && physiology.vasopressors_started) {
            // Ignore — shock can't recur with pressors running
          } else if (isSeizureEvent && er.has_seizure === false) {
            // Ignore — seizure already treated
          } else {
            deteriorationMessages.push(er.new_event as string);
            if (er.has_shock === true && !physiology.vasopressors_started)
              flags.shock_addressed = false;
            if (er.has_seizure === true)
              triggeredEvents.push(er.new_event as string);
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
      if (!session.started_at)
        sessionUpdate.started_at = new Date().toISOString();
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
      target:
        payload.testId ??
        payload.treatment ??
        payload.content?.slice(0, 100) ??
        null,
      payload: payload as Record<string, unknown>,
      response: responseData,
      elapsed_minutes: elapsedMinutes,
    });

    // Persist simulation feed updates so reloading a session keeps context.
    // Feed messages are written as observable clinical events — no diagnosis spoilers.
    const timelineMessages: string[] = [];

    // Action-level feed entries (clinical observations, not internal state strings)
    if (actionType === "order_test") {
      const testId = String(payload.testId ?? payload.content ?? "");
      const testDef = diagnosticTests.find((t) => String(t.id ?? "") === String(testId));
      const tatMinutes = Number(testDef?.tat_minutes ?? testDef?.turnaround_time_minutes ?? 30);
      const testName = testDef?.display_name ?? testId;
      const clinicalValue = String(testDef?.clinical_value ?? "");
      if ((responseData as Record<string, unknown>).success) {
        timelineMessages.push(`📋 Ordered: ${testName}. Results expected in ~${tatMinutes} min.`);
        if (clinicalValue === "inappropriate") {
          timelineMessages.push(`⚠️ Resource note: This test has limited clinical indication for the current presentation.`);
        } else if (clinicalValue === "low_yield_distractor") {
          timelineMessages.push(`⚠️ Resource note: This test has low yield for the current clinical picture.`);
        }
      }
    } else if (actionType === "administer_treatment") {
      const treatment = String(payload.treatment ?? payload.content ?? "");
      const appropriateness = String((responseData as Record<string, unknown>).appropriateness ?? "");
      const physiology = (patientState.physiology ?? {}) as Record<string, unknown>;
      const vitals = (physiology.vitals ?? {}) as Record<string, unknown>;
      const bpStr = vitals.bp_systolic ? `BP ${vitals.bp_systolic}/${vitals.bp_diastolic} mmHg` : "";
      const hrStr = vitals.hr_bpm ? `HR ${vitals.hr_bpm} bpm` : "";
      const postVitals = [bpStr, hrStr].filter(Boolean).join(", ");
      if (appropriateness === "potentially_harmful") {
        timelineMessages.push(`⚠️ ${treatment} administered — monitoring for adverse effects. ${postVitals ? `Current: ${postVitals}.` : ""}`);
      } else if (appropriateness === "unnecessary") {
        timelineMessages.push(`💊 ${treatment} administered. Limited clinical benefit expected. ${postVitals ? `Current: ${postVitals}.` : ""}`);
      } else {
        timelineMessages.push(`💊 ${treatment} administered. ${postVitals ? `Monitoring vitals: ${postVitals}.` : ""}`);
      }
    } else if (actionType === "advance_time") {
      const minutes = Number(payload.minutes ?? 5);
      const now = elapsedMinutes;
      timelineMessages.push(`🕐 ${minutes} minutes elapsed. Sim time: T+${now} min.`);
    } else if (actionType === "perform_exam") {
      timelineMessages.push(`🩺 Physical examination completed at T+${elapsedMinutes} min.`);
    } else if (actionType === "get_results") {
      const testId = String(payload.testId ?? payload.content ?? "");
      const testDef = diagnosticTests.find((t) => String(t.id ?? "") === String(testId));
      const testName = testDef?.display_name ?? testId;
      if ((responseData as Record<string, unknown>).status === "complete") {
        timelineMessages.push(`🔬 Results available: ${testName}.`);
      } else if ((responseData as Record<string, unknown>).status === "pending") {
        const order = orderedTests[testId];
        const remaining = order ? Math.max(0, order.resultAvailableAt - elapsedMinutes) : null;
        timelineMessages.push(`⏳ ${testName}: results still pending${remaining !== null ? ` (~${remaining} min remaining)` : ""}.`);
      }
    }

    // Runtime notices → clinical observations (no internal jargon)
    for (const n of runtimeNotices) {
      // Strip internal prefixes and expose only the clinical-facing part
      const cleaned = n.replace(/^\+\d+ min\)?\.?\s*/i, "").trim();
      if (cleaned) timelineMessages.push(`📝 ${cleaned}`);
    }

    // Deterioration events → observable clinical findings, not diagnoses
    for (const d of deteriorationMessages) {
      // Sanitize: remove any text that directly names the diagnosis or cause
      const sanitized = d
        .replace(/lack of .+? allows/gi, "Progression noted —")
        .replace(/without .+?[,;]/gi, "")
        .replace(/antibiot\w+\s*(therapy|treatment)?\s*(not started|not given|absent|delayed)?[,;]?/gi, "")
        .replace(/suspicion of \w+/gi, "")
        .replace(/unmanaged \w+/gi, "Unaddressed condition")
        .trim();
      timelineMessages.push(`🚨 ${sanitized || d}`);
    }

    // Clinical engine trajectory note → rephrase as bedside observation
    const clinicalNote = (responseData as Record<string, unknown>).clinical_note as string | undefined;
    if (clinicalNote && actionType !== "ask_patient" && actionType !== "consult_tutor") {
      // Strip diagnosis hints from the AI-generated clinical note
      const sanitizedNote = clinicalNote
        .replace(/\b(bacterial meningitis|meningitis|sepsis|encephalitis|meningococcal|pneumococcal)\b/gi, "the underlying condition")
        .replace(/antibiot\w+/gi, "antimicrobial therapy")
        .replace(/without .+?intervention/gi, "without intervention")
        .trim();
      if (sanitizedNote) timelineMessages.push(`📊 ${sanitizedNote}`);
    }

    if (timelineMessages.length > 0) {
      await db.from("session_messages").insert(
        timelineMessages.map((content) => ({
          session_id: sessionId,
          role: "system",
          content,
        })),
      );
    }

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
    if (runtimeNotices.length > 0) {
      result.notices = runtimeNotices;
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
