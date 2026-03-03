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
      "result_schema": [<array of result field names>],
      "clinical_value": "<one of: high_yield, moderate_yield, low_yield_distractor, inappropriate>",
      "why_it_might_be_ordered": "<brief rationale from a learner perspective>",
      "teaching_note": "<why this test is high value OR why it is low-value/inappropriate>"
    }
    // include all relevant tests for this case.
    // ALSO include realistic distractors to mimic real-life decision pressure:
    // - at least 2-4 low-yield or unnecessary tests/labs that a novice might order
    // - at least 1 test/lab that is clearly inappropriate for the presentation
    // These distractors should be plausible enough to tempt the learner.
  ],

  "test_results": {
    "<test_id>": {
      // MUST include one key-value pair for EVERY field listed in this test's result_schema.
      // Each key must match a result_schema field name exactly; each value is a string
      // with the numeric result, units, and (if abnormal) a flag like "(HIGH)" or "(LOW)".
      // Example for a Chem7 with result_schema ["na","k","cl","hco3","bun","creatinine","glucose"]:
      //   "na": "128 mEq/L (LOW)",
      //   "k": "3.8 mEq/L",
      //   "cl": "110 mEq/L (HIGH)",
      //   "hco3": "22 mEq/L",
      //   "bun": "7 mg/dL",
      //   "creatinine": "0.3 mg/dL",
      //   "glucose": "70 mg/dL",
      "interpretation": "<clinical interpretation summary>"
    }
    // one entry per diagnostic_test id — every result_schema field MUST appear as a key
  },

  "interventions": [
    {
      "id": "<intervention_id>",
      "display_name": "<human-readable name>",
      "category": "<one of: antibiotics, fluids, vasopressors, airway, anticonvulsant, anti_inflammatory, analgesic, general>",
      "options": [<array of specific drug/treatment names if applicable>],
      "appropriateness": "<one of: first_line, second_line, unnecessary, potentially_harmful>",
      "adverse_effect_risk": "<brief risk if given inappropriately, or null for safe options>"
    }
    // all relevant interventions for this case.
    // The "category" field is REQUIRED and maps to universal treatment categories
    // used by the orchestrator for dynamic treatment effect handling.
    // The "options" array should list specific drug names (e.g., ["ceftriaxone", "vancomycin"]).
    // Include deliberate management distractors:
    // - at least 2 unnecessary/low-value interventions
    // - at least 1 potentially harmful intervention that can cause adverse effects if chosen
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
    // STANDARDIZED ASSESSMENT RUBRIC (Version 0.1)
    // Aligned with AAMC Core EPAs (EPA 1–4, EPA 9) and R2T principles.
    // Four performance levels: Emerging, Developing, Proficient, Exemplary.
    // Point allocations per domain are DYNAMIC — adjust based on case complexity
    // and clinical emphasis. The domains below are REQUIRED for every case.
    // If Team-Based Collaboration is not applicable (single-player), omit it
    // and redistribute its points across other domains.
    //
    // IMPORTANT: Write descriptions that are CASE-SPECIFIC — reference the
    // actual clinical scenario, expected findings, and key decision points.
    // Do NOT use generic boilerplate.
    {
      "id": "history_taking_synthesis",
      "name": "History Taking and Synthesis",
      "max_points": <15 — adjust based on case>,
      "db_column": "history_taking_synthesis",
      "emerging_range": [0, <~33% of max>],
      "emerging_description": "History is incomplete or disorganized, missing many critical details relevant to this case; little to no synthesis of information.",
      "developing_range": [<emerging_max+1>, <~60% of max>],
      "developing_description": "Gathers basic history including some relevant details but misses others; somewhat organized but limited synthesis or linking of information.",
      "proficient_range": [<developing_max+1>, <~87% of max>],
      "proficient_description": "Obtains a thorough and organized history covering most key details; synthesizes findings into a coherent summary with minor omissions.",
      "exemplary_range": [<proficient_max+1>, <max_points>],
      "exemplary_description": "Elicits a comprehensive, focused history covering all pertinent information; highly organized, with clear synthesis into an accurate problem representation."
    },
    {
      "id": "physical_exam_interpretation",
      "name": "Physical Exam Interpretation",
      "max_points": <10 — adjust based on case>,
      "db_column": "physical_exam_interpretation",
      "emerging_range": [0, <~30% of max>],
      "emerging_description": "Identifies few exam findings or misinterprets key physical signs; lacks understanding of findings'' significance.",
      "developing_range": [<emerging_max+1>, <~60% of max>],
      "developing_description": "Recognizes obvious exam findings but misses subtler cues; demonstrates partial understanding of their significance and may misinterpret some findings.",
      "proficient_range": [<developing_max+1>, <~80% of max>],
      "proficient_description": "Correctly identifies and interprets important physical exam findings; understands their significance for the diagnosis, with only minor gaps.",
      "exemplary_range": [<proficient_max+1>, <max_points>],
      "exemplary_description": "Accurately interprets all pertinent exam findings, including subtle abnormalities; fully understands their implications and integrates them into diagnostic reasoning."
    },
    {
      "id": "differential_diagnosis_formulation",
      "name": "Differential Diagnosis Formulation",
      "max_points": <15 — adjust based on case>,
      "db_column": "differential_diagnosis_formulation",
      "emerging_range": [0, <~33% of max>],
      "emerging_description": "Offers an incomplete or incorrect differential (few or irrelevant possibilities); misses obvious diagnoses and provides no clear reasoning.",
      "developing_range": [<emerging_max+1>, <~60% of max>],
      "developing_description": "Lists some plausible diagnoses but misses important ones or includes unrelated options; limited prioritization with vague or minimal justification.",
      "proficient_range": [<developing_max+1>, <~87% of max>],
      "proficient_description": "Generates a solid differential with most likely diagnoses and some less-common considerations; prioritizes diagnoses based on patient data and provides reasoning for each choice.",
      "exemplary_range": [<proficient_max+1>, <max_points>],
      "exemplary_description": "Provides a comprehensive, well-prioritized differential including all likely and relevant alternate diagnoses; clearly articulates evidence-based reasoning for each possibility, demonstrating a systematic and rigorous approach."
    },
    {
      "id": "diagnostic_tests",
      "name": "Diagnostic Tests (Labs/Imaging)",
      "max_points": <10 — adjust based on case>,
      "db_column": "diagnostic_tests",
      "emerging_range": [0, <~30% of max>],
      "emerging_description": "Selects diagnostic tests unsystematically or misses key investigations; may order unnecessary tests and fails to interpret results correctly.",
      "developing_range": [<emerging_max+1>, <~60% of max>],
      "developing_description": "Chooses some appropriate labs/imaging but omits important tests or includes low-yield ones; shows basic result interpretation but misses finer points; limited prioritization.",
      "proficient_range": [<developing_max+1>, <~80% of max>],
      "proficient_description": "Selects appropriate, high-yield tests with minimal unnecessary investigations; interprets results accurately, recognizing most significant findings; uses results to refine the differential diagnosis effectively.",
      "exemplary_range": [<proficient_max+1>, <max_points>],
      "exemplary_description": "Strategically selects tests based on clinical evidence and priorities (avoids unnecessary investigations); interprets all results (including subtle findings) correctly; seamlessly integrates data to confirm or narrow diagnoses with exceptional efficiency."
    },
    {
      "id": "management_reasoning",
      "name": "Management Reasoning (Treatment Plan)",
      "max_points": <15 — adjust based on case>,
      "db_column": "management_reasoning",
      "emerging_range": [0, <~33% of max>],
      "emerging_description": "Proposes an incomplete or inappropriate management plan; misses critical interventions or orders; reasoning is unclear, not evidence-based, or unsafe.",
      "developing_range": [<emerging_max+1>, <~60% of max>],
      "developing_description": "Outlines a basic treatment plan addressing some issues, but important components (e.g., specific therapies, follow-up, patient education) are missing or poorly prioritized; reasoning shows partial understanding of standard care.",
      "proficient_range": [<developing_max+1>, <~87% of max>],
      "proficient_description": "Formulates a generally sound treatment plan covering major aspects of care (acute management, further workup, patient education, follow-up); plan is mostly evidence-based and appropriately prioritized, with only minor omissions or sequencing issues.",
      "exemplary_range": [<proficient_max+1>, <max_points>],
      "exemplary_description": "Develops a comprehensive, evidence-based treatment plan addressing immediate and long-term needs; prioritizes interventions logically (urgent issues first), including appropriate consultations, education, and follow-up; provides clear rationale for decisions, aligned with best practices."
    },
    {
      "id": "communication_empathy",
      "name": "Communication and Empathy",
      "max_points": <15 — adjust based on case>,
      "db_column": "communication_empathy",
      "emerging_range": [0, <~33% of max>],
      "emerging_description": "Communication is unclear or overly clinical; shows minimal empathy or listening, failing to address patient concerns or build rapport.",
      "developing_range": [<emerging_max+1>, <~60% of max>],
      "developing_description": "Communicates adequately with some lay language and occasional empathy, but consistency is lacking; addresses patient questions or emotions partially, with moderate rapport and some missed opportunities to reassure or clarify.",
      "proficient_range": [<developing_max+1>, <~87% of max>],
      "proficient_description": "Clearly and respectfully communicates in patient-friendly language; consistently demonstrates empathy and active listening, addresses the patient''s concerns and emotions; establishes good rapport and trust.",
      "exemplary_range": [<proficient_max+1>, <max_points>],
      "exemplary_description": "Exhibits outstanding communication that is patient-centered and compassionate; uses clear, jargon-free language with exceptional empathy, responding to patient concerns and emotional cues effectively; builds a strong therapeutic alliance."
    },
    {
      "id": "reflection_metacognition",
      "name": "Reflection and Metacognition",
      "max_points": <10 — adjust based on case>,
      "db_column": "reflection_metacognition",
      "emerging_range": [0, <~30% of max>],
      "emerging_description": "Shows little to no reflection on decisions or outcomes; fails to identify errors, knowledge gaps, or areas for improvement in their approach.",
      "developing_range": [<emerging_max+1>, <~60% of max>],
      "developing_description": "Demonstrates some reflection after the case, identifying a few basic lessons or obvious mistakes, but insights are superficial or need prompting; limited analysis of reasoning process.",
      "proficient_range": [<developing_max+1>, <~80% of max>],
      "proficient_description": "Thoughtfully reflects on performance and reasoning, identifying important successes and mistakes; offers clear insights into how to improve future practice or fill knowledge gaps; shows growing self-awareness.",
      "exemplary_range": [<proficient_max+1>, <max_points>],
      "exemplary_description": "Engages in deep, critical reflection on decision-making and outcomes; insightfully identifies subtle gaps in knowledge or reasoning and formulates concrete strategies for improvement; demonstrates rigorous self-assessment and commitment to continuous learning."
    }
    // NOTE: Use the EXACT ids and db_columns above. Compute concrete integer
    // ranges from the max_points you choose — do NOT leave angle-bracket
    // placeholders. Example for 15 pts: emerging [0,5], developing [6,9],
    // proficient [10,13], exemplary [14,15].
  ],

  "deterioration_rules": [
    {
      "if": "<condition expression using flag_name == true/false AND time >= N>",
      "then": {
        "event": "<event name>",
        "notes": "<clinical description of what happens>",
        "effects": {
          "vitals": { <optional: specific vital changes, e.g. "bp_systolic": 45, "hr_bpm": 200> },
          "flags": { <optional: boolean flags to set, e.g. "has_shock": true, "has_seizure": true> },
          "mental_status": "<optional: new mental status>"
        }
      }
    }
    // 2-4 deterioration rules. Include at least one rule representing iatrogenic harm
    // (adverse effect) if an unsafe intervention is chosen, and at least one progression
    // rule for delayed/missed critical care.
    // The "effects" object is optional but recommended
    // for critical events. If omitted, the orchestrator applies generic severity escalation.
  ]
}

## DETERIORATION & FLAG RULES

The orchestrator evaluates deterioration conditions using a generic parser.
Condition strings MUST follow the pattern: flag_name == true/false AND time >= N

Standard flag names the orchestrator sets automatically:
- correct_diagnosis_suspected: set when the student's DDx matches the correct diagnosis
- antibiotics_ordered / antibiotics_started: set when any antibiotic treatment is given
- shock_addressed: set when vasopressors or fluids are administered
- seizure_addressed: set when an anticonvulsant is given
- airway_addressed: set when intubation/ventilation is performed
- cultures_before_antibiotics: set when culture tests are ordered before antibiotics

You may reference these flags or define custom ones. For custom flags, the student's
differential diagnosis check will also set <primary_diagnosis_keyword>_suspected (e.g.,
meningitis_suspected, pneumonia_suspected) based on the correct_diagnosis field.

Example deterioration rules:
  {"if": "correct_diagnosis_suspected == false AND time >= 5", "then": {"event": "clinical_worsening", ...}}
  {"if": "antibiotics_started == false AND time >= 8", "then": {"event": "sepsis_progression", ...}}

## REALISM & INTERACTIVITY REQUIREMENTS

Design the case to feel like a live encounter, not a static worksheet:

- Include ambiguous but clinically believable signal vs noise:
  - key clues that point to the true diagnosis
  - distractor findings/tests/treatments that can mislead novice learners
- Make the patient/family communication dynamic across disclosures (new concerns,
  clarifications, emotional shifts, and context updates over time).
- Ensure actions have consequences:
  - high-value early actions should stabilize the patient faster
  - unnecessary actions should waste resources/time and hurt score
  - unsafe interventions should risk realistic adverse events
- Build explicit learning loops:
  - scoring penalties for low-yield testing and unsafe treatment
  - recovery opportunities after mistakes when corrected promptly
  - clear tradeoffs between speed, safety, and diagnostic certainty

## IMPORTANT RULES

1. Every field listed above is REQUIRED. Do not omit any.
2. All string values inside the JSON that contain single quotes must use double single-quotes ('') for PostgreSQL compatibility.
3. The "disclosures" array is the HEART of the case — each disclosure should contain rich narrative content and structured clinical data relevant to that stage of the case.
4. The "test_results" object MUST have an entry for EVERY id listed in "diagnostic_tests". Each entry MUST include a key-value pair for EVERY field in that test's result_schema (e.g., "na": "128 mEq/L (LOW)") PLUS an "interpretation" string. Do NOT return only an interpretation — the UI renders each result_schema field as a row in a lab report table.
5. Disclosure unlock types: START, ACTION, TIME, STATE, EVENT, ACTION_OR_TIME, ACTION_OR_STAGE, TIME_OR_ACTION.
6. Generate medically accurate, evidence-based content.
7. Make introduction paragraphs vivid and narrative-style (like a clinical vignette).
8. Return ONLY the JSON object — no markdown code fences, no preamble, no trailing text.
9. Make cases intentionally challenging with realistic distractors (tests and treatments) while remaining clinically coherent.
10. Include explicit patient-safety penalties for inappropriate tests/treatments and adverse-effect pathways for unsafe interventions.
11. Make the case interactive with meaningful time-based progression and action-triggered changes in disclosures and patient state.

## EVALUATION RUBRIC RULES (CRITICAL)

The evaluation_rubrics array must follow these rules precisely:

12. All 7 rubric domains are REQUIRED: history_taking_synthesis, physical_exam_interpretation, differential_diagnosis_formulation, diagnostic_tests, management_reasoning, communication_empathy, reflection_metacognition.
13. Each rubric MUST use the EXACT id and db_column values listed above — these map to database columns.
14. Point allocations are DYNAMIC per case. Adjust max_points based on the clinical emphasis of the case. Suggested defaults: Hx=15, PE=10, DDx=15, Dx Tests=10, Mgmt=15, Comm=15, Reflection=10 (total 90). You may redistribute points based on case complexity (e.g., a case emphasizing management may weight Mgmt higher).
15. All range values must be CONCRETE INTEGERS — no placeholders. Ranges must cover 0 through max_points with no gaps or overlaps. Use this pattern:
    - For 15-point domains: emerging [0,5], developing [6,9], proficient [10,13], exemplary [14,15]
    - For 10-point domains: emerging [0,3], developing [4,6], proficient [7,8], exemplary [9,10]
    - Scale proportionally for other point values.
16. Performance level descriptions must be CASE-SPECIFIC — reference actual clinical findings, expected diagnoses, and key decision points from the case being generated. Do NOT use generic boilerplate.
17. The rubric is aligned with AAMC Core Entrustable Professional Activities: EPA 1 (history & physical), EPA 2 (differential diagnosis), EPA 3 (diagnostic tests), EPA 4 (orders/management), EPA 9 (teamwork/collaboration). Ensure the rubric descriptions reflect these competency expectations.
18. The rubric emphasizes Rigor, Reproducibility, and Transparency (R2T) in clinical reasoning — descriptions should reward systematic approaches and evidence-based justification.`;

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
Include realistic distractor tests/treatments, at least one potentially harmful intervention with adverse-effect consequences, and interactive progression (time- and action-driven changes) to mimic a live case.

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
