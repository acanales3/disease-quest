/**
 * AI Case Content Generator
 *
 * Uses OpenAI o4-mini (reasoning model) to generate a complete clinical
 * simulation case JSON from extracted PDF text. Includes retry-aware
 * error feedback so the model can self-correct.
 */

import OpenAI from "openai";

// ---------------------------------------------------------------------------
// System prompt — defines the exact JSON schema the AI must produce
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a medical education simulation case designer for the DiseaseQuest platform.

Your job is to read raw clinical case content (extracted from a PDF) and produce a **complete, well-structured JSON object** that powers an interactive patient simulation.

You MUST return **only valid JSON** with no markdown fencing, no explanatory text—just the raw JSON object.

## REQUIRED JSON SCHEMA

Your output must contain ALL of the following top-level fields:

{
  "schema_version": "1.0",
  "case_id": "<unique id, e.g. DQ-XXX-0001>",
  "title": "<Patient Name> — <Diagnosis>",
  "setting": "<clinical setting, e.g. Emergency Department → ICU>",
  "learner_level": ["MS1", "MS2", "MS3"],
  "estimated_minutes": <number, typically 30-60>,
  "difficulty": "<brief description>",
  "core_skills": [<array of skill strings>],
  "correct_diagnosis": "<full diagnosis string>",
  "key_findings": [<array of key clinical finding strings>],
  "success_conditions": [<array of success condition strings>],
  "failure_conditions": [<array of failure condition strings>],

  "initial_vitals": {
    "temp_f": <number>,
    "bp_systolic": <number>,
    "bp_diastolic": <number>,
    "hr_bpm": <number>,
    "rr_bpm": <number>,
    "spo2_percent": <number>,
    "cap_refill_sec": <number>
  },

  "introduction": {
    "paragraphs": [
      "<paragraph 1: vivid narrative introducing the patient, their background, and the situation>",
      "<paragraph 2: social/environmental context>",
      "<paragraph 3: caregiver perspective and journey to seeking care>",
      "<paragraph 4: medical history and baseline health>"
    ],
    "instructions": [
      "Interview the patient/family to gather a thorough history",
      "Perform a focused physical examination",
      "Order appropriate diagnostic tests based on your clinical reasoning",
      "Develop and refine a differential diagnosis",
      "Initiate management as indicated",
      "You can consult your mentor at any time for guidance"
    ]
  },

  "initial_patient_state": {
    "patient_id": "<unique_id>",
    "name": "<Patient Full Name>",
    "age_months": <number or null if adult, use age_years for adults>,
    "sex": "<Male or Female>",
    "chief_complaint": "<brief chief complaint>",
    "history_of_present_illness": "<detailed HPI paragraph>",
    "past_medical_history": [<array of strings>],
    "medications": [<array of strings>],
    "allergies": [<array, use 'NKDA' if none>],
    "family_history": [<array of strings>],
    "social_history": {
      "living_situation": "<string>",
      <other relevant social factors as key-value pairs>
    },
    "social_context": {
      <boolean flags relevant to the case, e.g. "rural": true>
    },
    "ros_positives": [<array of positive review-of-systems findings>],
    "ros_negatives": [<array of negative review-of-systems findings>],
    "emotional_state": "<description of patient/family emotional state>",
    "cooperation_level": "<cooperative, anxious, combative, etc.>",
    "physiology": {
      "vitals": {
        "temp_f": <number>,
        "bp_systolic": <number>,
        "bp_diastolic": <number>,
        "hr_bpm": <number>,
        "rr_bpm": <number>,
        "spo2_percent": <number>,
        "cap_refill_sec": <number>,
        "weight_kg": <number>
      },
      "mental_status": "<alert, confused, lethargic, obtunded, comatose>",
      "neuro_signs": [<array of neurological findings>],
      "rash": "<description or null>",
      "skin_findings": [<array of skin findings>],
      "has_shock": false,
      "has_seizure": false,
      "has_respiratory_failure": false,
      "is_intubated": false,
      "antibiotics_started": false,
      "fluids_given": false,
      "vasopressors_started": false,
      "dexamethasone_given": false
    }
  },

  "learning_objectives": [
    {
      "id": "LO1",
      "text": "<learning objective text>",
      "tags": [<relevant tags>]
    }
    // ... at least 8-16 learning objectives
  ],

  "disclosures": [
    {
      "id": "D1",
      "title": "<disclosure title>",
      "unlock": { "type": "START" },
      "content": {
        // rich structured content relevant to this disclosure stage
      },
      "maps_to_objectives": ["LO1", "LO2"]
    }
    // ... provide 10-14 disclosures covering: 
    //   D1: Chief Complaint & History (unlock: START)
    //   D2: Physical Exam & Vitals
    //   D3: Initial Orders
    //   D4: Initial Lab Results
    //   D5: Empiric Management
    //   D6-D7: Specialized test results (CSF, imaging, etc.)
    //   D8: Acute Deterioration (if applicable)
    //   D9: ICU/Advanced Management
    //   D10-D11: Stabilization & Monitoring
    //   D12: Culture/Definitive Results
    //   D13: Specialist Consult & De-escalation
    //   D14: Discharge & Follow-up
    // Adjust the number and content based on the clinical case complexity.
    // Each disclosure unlock type must be one of: START, ACTION, TIME, STATE, EVENT, ACTION_OR_TIME, ACTION_OR_STAGE, TIME_OR_ACTION
  ],

  "diagnostic_tests": [
    {
      "id": "<test_id>",
      "display_name": "<human-readable name>",
      "cost_points": <number 1-5>,
      "tat_minutes": 1,
      "result_schema": [<array of result field names>]
    }
    // include all relevant tests for this case
  ],

  "test_results": {
    "<test_id>": {
      // detailed result values with interpretation
      "interpretation": "<clinical interpretation>"
    }
    // one entry per diagnostic_test id
  },

  "interventions": [
    {
      "id": "<intervention_id>",
      "display_name": "<human-readable name>",
      "options": [<array of options if applicable>]
    }
    // all relevant interventions for this case
  ],

  "scoring_categories": {
    "<category_name>": {
      "max_points": <number>,
      "rules": [
        { "id": "<rule_id>", "when": "<condition description>", "points": <number> }
      ],
      "penalties": [
        { "id": "<penalty_id>", "when": "<condition>", "points": <negative number> }
      ]
    }
    // include: diagnostic_efficiency, resource_management, critical_finding_identification,
    // patient_safety, final_diagnosis_and_plan (at minimum)
  },

  "achievements": [
    { "id": "A1", "name": "<achievement name>", "criteria": "<criteria>" }
    // 3-6 achievements
  ],

  "evaluation_rubrics": [
    {
      "id": "<rubric_id>",
      "name": "<rubric name>",
      "max_points": <number>,
      "db_column": "<snake_case_column_name>",
      "emerging_range": [<min>, <max>],
      "emerging_description": "<description>",
      "developing_range": [<min>, <max>],
      "developing_description": "<description>",
      "proficient_range": [<min>, <max>],
      "proficient_description": "<description>",
      "exemplary_range": [<min>, <max>],
      "exemplary_description": "<description>"
    }
    // Required rubrics: history_taking_synthesis, physical_exam_interpretation,
    // differential_diagnosis_formulation, diagnostic_tests, management_reasoning,
    // communication_empathy, reflection_metacognition
  ],

  "deterioration_rules": [
    {
      "if": "<condition expression>",
      "then": { "event": "<event name>", "notes": "<notes>" }
    }
    // 2-4 deterioration rules
  ]
}

## IMPORTANT RULES

1. Every field listed above is REQUIRED. Do not omit any.
2. All string values inside the JSON that contain single quotes must use double single-quotes ('') for PostgreSQL compatibility.
3. The "disclosures" array is the HEART of the case — each disclosure should contain rich narrative content and structured clinical data relevant to that stage of the case.
4. The "test_results" object MUST have an entry for EVERY id listed in "diagnostic_tests".
5. Disclosure unlock types: START, ACTION, TIME, STATE, EVENT, ACTION_OR_TIME, ACTION_OR_STAGE, TIME_OR_ACTION.
6. Generate medically accurate, evidence-based content.
7. Make introduction paragraphs vivid and narrative-style (like a clinical vignette).
8. Return ONLY the JSON object — no markdown code fences, no preamble, no trailing text.`;

// ---------------------------------------------------------------------------
// Generator function
// ---------------------------------------------------------------------------

export interface GenerationResult {
  content: Record<string, unknown> | null;
  rawResponse: string;
  error: string | null;
}

/**
 * Generate a complete case content JSON using OpenAI.
 *
 * @param pdfText      - Extracted text from the uploaded PDF
 * @param caseName     - Admin-provided case name
 * @param description  - Admin-provided case description
 * @param previousError - If retrying, the error from the previous attempt (for self-correction)
 */
export async function generateCaseContent(
  pdfText: string,
  caseName: string,
  description: string,
  previousError: string | null = null
): Promise<GenerationResult> {
  console.log("[CASE-GEN] Starting case content generation...");
  console.log(`[CASE-GEN] PDF text length: ${pdfText.length} chars`);
  console.log(`[CASE-GEN] Case name: "${caseName}"`);
  console.log(`[CASE-GEN] Is retry: ${!!previousError}`);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("[CASE-GEN] ERROR: OPENAI_API_KEY not set!");
    return {
      content: null,
      rawResponse: "",
      error: "OPENAI_API_KEY is not configured on the server.",
    };
  }
  console.log("[CASE-GEN] OpenAI API key found");

  const openai = new OpenAI({ apiKey });

  // Build user prompt
  let userPrompt = `Generate a complete DiseaseQuest clinical simulation case from the following information.

**Case Name:** ${caseName}
**Description:** ${description}

**Extracted PDF Content:**
---
${pdfText.substring(0, 60000)}
---

Analyze the clinical case content thoroughly. Create all disclosures, test results, interventions, scoring, and evaluation rubrics. Make sure the case is medically accurate and detailed.

Return ONLY the JSON object.`;

  // If retrying, prepend the error for self-correction
  if (previousError) {
    userPrompt = `IMPORTANT: Your previous attempt to generate this case JSON had errors. Please fix them and regenerate.

**Previous errors:**
${previousError}

---

${userPrompt}`;
  }

  try {
    console.log("[CASE-GEN] Sending request to OpenAI o4-mini...");
    console.log(`[CASE-GEN] Prompt length: ${userPrompt.length} chars`);
    const callStart = Date.now();

    const response = await openai.chat.completions.create({
      model: "o4-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const elapsed = Date.now() - callStart;
    console.log(`[CASE-GEN] OpenAI responded in ${elapsed}ms (${(elapsed / 1000).toFixed(1)}s)`);
    console.log(`[CASE-GEN] Usage: ${JSON.stringify(response.usage ?? {})}`);

    const rawResponse = response.choices?.[0]?.message?.content ?? "";
    console.log(`[CASE-GEN] Response length: ${rawResponse.length} chars`);

    if (!rawResponse.trim()) {
      console.log("[CASE-GEN] ERROR: Empty response from OpenAI");
      return {
        content: null,
        rawResponse,
        error: "OpenAI returned an empty response.",
      };
    }

    // Try to parse as JSON — strip markdown fences if present
    let jsonStr = rawResponse.trim();
    if (jsonStr.startsWith("```")) {
      console.log("[CASE-GEN] Stripping markdown code fences from response");
      jsonStr = jsonStr
        .replace(/^```(?:json)?\s*\n?/, "")
        .replace(/\n?```\s*$/, "");
    }

    try {
      const parsed = JSON.parse(jsonStr);
      const keys = Object.keys(parsed);
      console.log(`[CASE-GEN] JSON parsed successfully — ${keys.length} top-level keys`);
      console.log(`[CASE-GEN] Keys: ${keys.join(", ")}`);
      return {
        content: parsed,
        rawResponse,
        error: null,
      };
    } catch (parseErr: unknown) {
      const msg =
        parseErr instanceof Error ? parseErr.message : String(parseErr);
      console.log(`[CASE-GEN] JSON PARSE FAILED: ${msg}`);
      console.log(`[CASE-GEN] First 300 chars of response: ${rawResponse.substring(0, 300)}`);
      return {
        content: null,
        rawResponse: rawResponse.substring(0, 500),
        error: `Failed to parse AI response as JSON: ${msg}`,
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`[CASE-GEN] OpenAI API CALL FAILED: ${msg}`);
    return {
      content: null,
      rawResponse: "",
      error: `OpenAI API call failed: ${msg}`,
    };
  }
}
