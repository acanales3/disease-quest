/**
 * Clinical Engine – Supabase Edge Function
 *
 * AI-driven physiological simulation. Called by the orchestrator after
 * every student action to determine realistic vital sign changes,
 * new complications, and clinical events.
 *
 * This replaces the deterministic if/else rules with an LLM that
 * reasons about pathophysiology.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { chatCompletion, type ChatMessage } from "../_shared/openai.ts";

interface ClinicalEngineRequest {
  lastAction: {
    type: string;
    detail: string;
  };
  patientState: {
    vitals: {
      hr_bpm: number;
      bp_systolic: number;
      bp_diastolic: number;
      temp_f: number;
      rr_bpm: number;
      spo2_percent: number;
      cap_refill_sec: number;
    };
    mental_status: string;
    has_shock: boolean;
    has_seizure: boolean;
    has_respiratory_failure: boolean;
    is_intubated: boolean;
    antibiotics_started: boolean;
    fluids_given: boolean;
    vasopressors_started: boolean;
    dexamethasone_given: boolean;
  };
  treatmentsGiven: string[];
  testsOrdered: string[];
  elapsedMinutes: number;
  /** Full case context from Supabase */
  caseContext: {
    correct_diagnosis: string;
    setting: string;
    difficulty: string;
    key_findings: string[];
    deterioration_rules: Array<Record<string, unknown>>;
    interventions: Array<{ id: string; name: string }>;
    initial_vitals: Record<string, unknown>;
    unlocked_disclosure_content: Array<{ id: string; title: string; content: Record<string, unknown> }>;
    scoring_categories: Record<string, unknown>;
  };
  flags: Record<string, boolean>;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: ClinicalEngineRequest = await req.json();

    const cc = body.caseContext;
    const detRulesText = (cc.deterioration_rules ?? [])
      .map((r) => `  - IF ${(r as Record<string, unknown>).if} THEN ${JSON.stringify((r as Record<string, unknown>).then)}`)
      .join("\n");
    const interventionsText = (cc.interventions ?? [])
      .map((i) => `  - ${i.name}`)
      .join("\n");
    const disclosuresText = (cc.unlocked_disclosure_content ?? [])
      .map((d) => `  - ${d.id}: ${d.title}`)
      .join("\n");
    const keyFindingsText = (cc.key_findings ?? []).join(", ");
    const initialVitals = cc.initial_vitals as Record<string, unknown>;

    const prompt = `You are a clinical physiology simulation engine for a medical education game.

CASE: ${cc.correct_diagnosis}
SETTING: ${cc.setting}
DIFFICULTY: ${cc.difficulty}
KEY FINDINGS: ${keyFindingsText}

BASELINE VITALS (start of case):
  HR: ${initialVitals.hr_bpm ?? '?'}, BP: ${initialVitals.bp_systolic ?? '?'}/${initialVitals.bp_diastolic ?? '?'}, Temp: ${initialVitals.temp_f ?? '?'}°F, SpO2: ${initialVitals.spo2_percent ?? '?'}%, RR: ${initialVitals.rr_bpm ?? '?'}, Cap Refill: ${initialVitals.cap_refill_sec ?? '?'}s

DETERIORATION RULES (from case definition):
${detRulesText || '  None defined'}

AVAILABLE INTERVENTIONS (for reference only — do NOT apply effects of interventions NOT in the TREATMENTS GIVEN list below):
${interventionsText || '  None'}

DISCLOSURES REVEALED SO FAR:
${disclosuresText || '  None'}

CURRENT PATIENT STATE:
- HR: ${body.patientState.vitals.hr_bpm} bpm
- BP: ${body.patientState.vitals.bp_systolic}/${body.patientState.vitals.bp_diastolic} mmHg
- Temp: ${body.patientState.vitals.temp_f}°F
- RR: ${body.patientState.vitals.rr_bpm}/min
- SpO2: ${body.patientState.vitals.spo2_percent}%
- Cap Refill: ${body.patientState.vitals.cap_refill_sec}s
- Mental Status: ${body.patientState.mental_status}
- Shock: ${body.patientState.has_shock}
- Seizure: ${body.patientState.has_seizure}
- Respiratory Failure: ${body.patientState.has_respiratory_failure}
- Intubated: ${body.patientState.is_intubated}
- Antibiotics started: ${body.patientState.antibiotics_started}
- Fluids given: ${body.patientState.fluids_given}
- Vasopressors: ${body.patientState.vasopressors_started}
- Dexamethasone: ${body.patientState.dexamethasone_given}

ELAPSED TIME: ${body.elapsedMinutes} minutes
TREATMENTS GIVEN SO FAR: ${body.treatmentsGiven.join(', ') || 'None — no treatments administered yet'}
TESTS ORDERED: ${body.testsOrdered.join(', ') || 'None'}

FLAGS:
${Object.entries(body.flags ?? {})
      .filter(([key, value]) => !key.startsWith("_") && typeof value === "boolean")
      .map(([key, value]) => `- ${key}: ${value ? "Yes" : "No"}`)
      .join("\n") || "- None recorded"}

THE STUDENT JUST DID: ${body.lastAction.type} — "${body.lastAction.detail}"

CRITICAL RULES:
- You MUST ONLY apply physiological effects of treatments that appear in "TREATMENTS GIVEN SO FAR". If that list is empty or does not contain a treatment, you CANNOT reference adverse effects, benefits, or reactions from it.
- Do NOT invent treatments. Do NOT apply adverse effects from the "AVAILABLE INTERVENTIONS" list unless those interventions are in TREATMENTS GIVEN SO FAR.
- new_event must be null unless a genuine clinical event is occurring based on elapsed time + untreated disease. It must NEVER reference a treatment that was not given.

Based on the FULL CASE CONTEXT and real pathophysiology, determine what happens next.

CRITICAL TIMING RULES (MUST FOLLOW):
- This engine must work for ANY uploaded case, not one specific diagnosis pattern.
- Early in a case, keep changes subtle unless the case context, current vitals, deterioration rules, or recent unsafe treatment justify sharper decline.
- Use the uploaded deterioration rules and the current patient state as the primary driver of worsening. Do not assume seizures, shock, respiratory failure, antibiotics, or any other event are universally relevant.
- If the student gives appropriate treatment for the likely problem, improvement should be gradual over multiple actions, not instant.
- If the student gives unnecessary or harmful treatment, worsening can occur, but it still needs to stay physiologically plausible and tied to what was actually given.

ABSOLUTE PHYSIOLOGICAL LIMITS (a living patient MUST stay within these):
  - HR: 30–220 bpm (NEVER 0 — a heart rate of 0 means death, which is NOT allowed)
  - BP systolic: 35–220 mmHg (NEVER 0)
  - BP diastolic: 20–130 mmHg (NEVER 0)
  - Temp: 92.0–107.0°F
  - RR: 6–55 breaths/min (NEVER 0)
  - SpO2: 55–100%
  - Cap refill: 0.5–10.0s
  - The patient CANNOT die. Even in the worst deterioration, vitals reach critical lows but never zero.

CHANGE MAGNITUDE RULES:
- Each action should change vitals by SMALL amounts only:
  - HR: change by 3-10 bpm per action (not 20-30)
  - BP: change by 2-5 mmHg per action
  - Temp: change by 0.1-0.3°F per action
  - SpO2: change by 1-2% per action (unless intubated)
  - Cap refill: change by 0.5s per action
- NEVER make dramatic vital swings in a single action
- The maximum change from CURRENT vitals in any single action is: HR ±15, BP ±10, Temp ±0.5, SpO2 ±3, RR ±5
- If the student is just talking to the patient or ordering tests, vitals should barely change (±1-2 on any value)

WHEN TO TRIGGER COMPLICATIONS:
- Trigger complications only when supported by the case-specific deterioration rules, worsening physiology, or consequences of unsafe treatment.
- Keep complication timing believable: most serious events should emerge after a pattern of deterioration, not out of nowhere.
- Do not introduce diagnosis-specific complications unless the case context supports them.

IMPROVEMENT RULES:
- Appropriate treatments should improve the relevant physiology gradually.
- Supportive care such as fluids, airway support, antimicrobials, vasopressors, and other case-defined interventions should change the specific vitals they would realistically affect.
- Multiple appropriate treatments together can improve the trajectory slightly faster, but still gradually. 

Return ONLY valid JSON with this exact structure:
{
  "vitals": {
    "hr_bpm": <number>,
    "bp_systolic": <number>,
    "bp_diastolic": <number>,
    "temp_f": <number, one decimal>,
    "rr_bpm": <number>,
    "spo2_percent": <number>,
    "cap_refill_sec": <number, one decimal>
  },
  "mental_status": "<alert|drowsy|lethargic|obtunded|stuporous|comatose>",
  "has_shock": <boolean>,
  "has_seizure": <boolean>,
  "has_respiratory_failure": <boolean>,
  "new_event": "<null or string describing what happened, e.g. 'Patient developed generalized tonic-clonic seizure' or null>",
  "clinical_note": "<brief 1-sentence description of patient's trajectory, e.g. 'Patient showing early signs of improvement after antibiotics'>"
}`;

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: "You are a medical physiology simulation engine. Return ONLY valid JSON. No markdown, no explanation. Just the JSON object.",
      },
      { role: "user", content: prompt },
    ];

    const responseText = await chatCompletion(messages, {
      temperature: 0.3, // Low temp for consistency but not zero — allows some variation
      max_tokens: 500,
    });

    // Parse JSON
    let result: Record<string, unknown>;
    try {
      const jsonStart = responseText.indexOf("{");
      const jsonEnd = responseText.lastIndexOf("}") + 1;
      result = JSON.parse(responseText.slice(jsonStart, jsonEnd));
    } catch {
      // Fallback: return current state unchanged
      result = {
        vitals: body.patientState.vitals,
        mental_status: body.patientState.mental_status,
        has_shock: body.patientState.has_shock,
        has_seizure: body.patientState.has_seizure,
        has_respiratory_failure: body.patientState.has_respiratory_failure,
        new_event: null,
        clinical_note: "Unable to assess — maintaining current state.",
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Clinical engine error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
