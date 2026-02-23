/**
 * Evaluator Agent – Supabase Edge Function
 *
 * Generates structured evaluation after case completion.
 * Dynamically reads the rubric from the case content JSONB so every
 * case can define its own domains, point ranges, and descriptions.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { chatCompletion, type ChatMessage } from "../_shared/openai.ts";

interface RubricDomain {
  id: string;
  name: string;
  max_points: number;
  db_column: string;
  emerging_range: [number, number];
  emerging_description: string;
  developing_range: [number, number];
  developing_description: string;
  proficient_range: [number, number];
  proficient_description: string;
  exemplary_range: [number, number];
  exemplary_description: string;
}

interface EvaluatorRequest {
  caseContent: Record<string, unknown>;
  sessionData: {
    elapsedMinutes: number;
    finalDiagnosis: string | null;
    finalDiagnosisReasoning: string | null;
    differentialHistory: Array<{
      timestamp_minutes: number;
      diagnoses: Array<{ diagnosis: string; likelihood?: string; reasoning?: string }>;
    }>;
    testOrders: Array<{ testId: string; orderedAt: number; hasResults: boolean }>;
    actionLog: Array<{
      actor: string;
      action_type: string;
      target?: string;
      payload?: Record<string, unknown>;
      response?: string;
      elapsed_minutes: number;
    }>;
    conversationHistory: Array<{ role: string; content: string }>;
    flags: Record<string, boolean>;
    treatmentsAdministered: string[];
  };
}

/**
 * Determine the performance level label for a given score within a rubric domain.
 */
function getPerformanceLevel(score: number, rubric: RubricDomain): string {
  if (score >= rubric.exemplary_range[0]) return "Exemplary";
  if (score >= rubric.proficient_range[0]) return "Proficient";
  if (score >= rubric.developing_range[0]) return "Developing";
  return "Emerging";
}

/**
 * Build the rubric text for the LLM prompt from the case's evaluation_rubrics.
 * Also builds the expected JSON output keys.
 */
function formatRubric(rubrics: RubricDomain[]): { rubricText: string; scoreKeys: string } {
  const lines: string[] = [];
  const jsonKeys: string[] = [];

  for (const r of rubrics) {
    lines.push(`\n### ${r.name} (${r.id}) — ${r.max_points} points`);
    lines.push(`  Emerging  (${r.emerging_range[0]}–${r.emerging_range[1]}): ${r.emerging_description}`);
    lines.push(`  Developing (${r.developing_range[0]}–${r.developing_range[1]}): ${r.developing_description}`);
    lines.push(`  Proficient (${r.proficient_range[0]}–${r.proficient_range[1]}): ${r.proficient_description}`);
    lines.push(`  Exemplary  (${r.exemplary_range[0]}–${r.exemplary_range[1]}): ${r.exemplary_description}`);

    jsonKeys.push(
      `    "${r.id}": { "earned": <integer ${r.emerging_range[0]}-${r.max_points}>, "max": ${r.max_points}, "level": "<Emerging|Developing|Proficient|Exemplary>", "strengths": ["..."], "improvements": ["..."], "feedback": "..." }`
    );
  }

  return {
    rubricText: lines.join("\n"),
    scoreKeys: jsonKeys.join(",\n"),
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: EvaluatorRequest = await req.json();
    const { caseContent, sessionData } = body;

    // ── Read rubric dynamically from case content ──
    const rubrics = (caseContent.evaluation_rubrics ?? []) as RubricDomain[];
    const { rubricText, scoreKeys } = formatRubric(rubrics);
    const totalMax = rubrics.reduce((s, r) => s + r.max_points, 0);

    // ── Format action log ──
    const logSummary = (sessionData.actionLog ?? [])
      .map((a) => {
        let line = `[${a.elapsed_minutes} min] ${a.actor.toUpperCase()} - ${a.action_type}`;
        if (a.target) line += ` -> ${a.target}`;
        if (a.response) line += `\n  Response: ${String(a.response).slice(0, 200)}`;
        return line;
      })
      .join("\n");

    // ── Format differential history ──
    const diffHistory = (sessionData.differentialHistory ?? [])
      .map((d) => {
        const dxList = d.diagnoses
          .map((dx, i) => `  ${i + 1}. ${dx.diagnosis} (${dx.likelihood ?? "?"}) – ${dx.reasoning ?? ""}`)
          .join("\n");
        return `At ${d.timestamp_minutes} min:\n${dxList}`;
      })
      .join("\n\n");

    // ── Format tests ──
    const testsText = (sessionData.testOrders ?? [])
      .map((t) => `- ${t.testId} (ordered at ${t.orderedAt} min) – ${t.hasResults ? "Completed" : "Pending"}`)
      .join("\n");

    // ── Format conversation for communication assessment ──
    const conversationText = (sessionData.conversationHistory ?? [])
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    // ── Build prompt ──
    const evalPrompt = `Evaluate this student's performance in the DiseaseQuest clinical simulation.

═══════════════════════════════════════════════
CASE DETAILS
═══════════════════════════════════════════════
CASE: ${caseContent.title ?? "Unknown"}
CORRECT DIAGNOSIS: ${caseContent.correct_diagnosis ?? "Unknown"}
KEY FINDINGS: ${((caseContent.key_findings ?? []) as string[]).join(", ")}
SETTING: ${caseContent.setting ?? "Unknown"}
DIFFICULTY: ${caseContent.difficulty ?? "Unknown"}

═══════════════════════════════════════════════
ASSESSMENT RUBRIC
═══════════════════════════════════════════════
This rubric is aligned with AAMC Core Entrustable Professional Activities:
- EPA 1: Gather a history and perform a physical examination
- EPA 2: Prioritize a differential diagnosis
- EPA 3: Recommend and interpret diagnostic tests
- EPA 4: Enter and discuss orders/management plans
- EPA 9: Collaborate as a member of an interprofessional team

Scoring emphasizes Rigor, Reproducibility, and Transparency (R2T) in clinical reasoning.

Use these EXACT domains, IDs, and point ranges:
${rubricText}

Total possible points: ${totalMax}

═══════════════════════════════════════════════
STUDENT PERFORMANCE DATA
═══════════════════════════════════════════════

INTERACTION LOG (chronological):
${logSummary || "No actions recorded"}

CONVERSATION WITH PATIENT/FAMILY:
${conversationText || "No conversation recorded"}

STUDENT'S FINAL DIAGNOSIS: ${sessionData.finalDiagnosis ?? "Not provided"}
STUDENT'S REASONING: ${sessionData.finalDiagnosisReasoning ?? "Not provided"}

DIFFERENTIAL DIAGNOSIS HISTORY:
${diffHistory || "No differential diagnosis recorded"}

TESTS ORDERED:
${testsText || "No tests ordered"}

TIMING & FLAGS:
- Total case time: ${sessionData.elapsedMinutes} minutes
- Antibiotics ordered: ${sessionData.flags?.antibiotics_ordered ? "Yes" : "No"}
- Cultures before antibiotics: ${sessionData.flags?.cultures_before_antibiotics ? "Yes" : "No/Unknown"}
- Meningitis suspected: ${sessionData.flags?.meningitis_suspected ? "Yes" : "No"}
- Shock recognized: ${sessionData.flags?.shock_recognized ? "Yes" : "No"}
- Treatments given: ${(sessionData.treatmentsAdministered ?? []).join(", ") || "None"}

═══════════════════════════════════════════════
SCORING INSTRUCTIONS
═══════════════════════════════════════════════

1. Score each domain independently using the EXACT score ranges from the rubric above.
2. The "earned" score MUST fall within one of the four defined ranges (Emerging/Developing/Proficient/Exemplary). The "level" field must match the range the score falls in.
3. Evaluate PROCESS and REASONING, not just outcomes. A student who demonstrates sound clinical reasoning but reaches an imperfect conclusion should score higher than one who guesses correctly.
4. Be SPECIFIC — cite exact moments, timestamps, and actions from the interaction log as evidence for each score.
5. For each domain, identify concrete strengths AND areas for improvement.

DOMAIN-SPECIFIC GUIDANCE:
- History Taking: Assess completeness, organization, and synthesis of HPI, PMH, social history, ROS. Did the student ask focused, high-yield questions? Did they synthesize findings into a problem representation?
- Physical Exam: Did the student recognize and correctly interpret key physical findings? Did they understand the clinical significance?
- Differential Diagnosis: Was the DDx comprehensive, appropriately prioritized, and evidence-based? Did the student revise it as new data emerged?
- Diagnostic Tests: Were tests ordered strategically and efficiently? Were results interpreted correctly and used to refine the differential?
- Management: Was the treatment plan timely, evidence-based, and appropriately prioritized? Were critical interventions addressed?
- Communication & Empathy: Review the CONVERSATION section. Was language patient-friendly? Did the student show empathy, address concerns, and build rapport?
- Reflection & Metacognition: Evaluate based on demonstrated self-awareness, reasoning transparency, explicit acknowledgment of uncertainty, and any reflective statements during the case. If the student showed no reflection, score in the Emerging range.

Return valid JSON with this EXACT structure:
{
  "competency_scores": {
${scoreKeys}
  },
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": ["Area 1", "Area 2", "Area 3"],
  "missed_critical_actions": [
    { "action": "...", "importance": "high|medium|low", "consequence": "...", "should_have_done": "...", "when": "at X minutes / during Y phase", "learning_point": "..." }
  ],
  "reflection_prompts": [
    { "prompt": "...", "context": "...", "competencies": ["..."] }
  ],
  "overall_feedback": "Summary narrative covering overall performance, key takeaways, and specific next steps for improvement...",
  "reasoning_analysis": "Detailed analysis of the student's clinical reasoning process — how they gathered data, formed hypotheses, tested them, and reached conclusions. Identify reasoning strengths (e.g., systematic approach, appropriate urgency) and weaknesses (e.g., premature closure, anchoring bias, availability bias)..."
}`;

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are an expert medical education evaluator for the DiseaseQuest PBL simulation platform. You evaluate student clinical reasoning using a structured rubric aligned with AAMC Core Entrustable Professional Activities (EPAs 1-4, 9) and the principles of Rigor, Reproducibility, and Transparency (R2T).

Your evaluation must be:
- FAIR: Score based on evidence from the interaction log, not assumptions about what the student might have done.
- SPECIFIC: Cite exact actions, timestamps, and decisions as evidence for each score.
- CONSTRUCTIVE: Frame feedback to promote learning. Identify what went well before addressing gaps.
- CALIBRATED: Use the full scoring range. Reserve Exemplary for genuinely outstanding performance; use Emerging only when performance clearly falls short.
- PROCESS-ORIENTED: Evaluate the quality of clinical reasoning, not just whether the student reached the correct diagnosis.

Return valid JSON only — no markdown fencing, no preamble.`,
      },
      { role: "user", content: evalPrompt },
    ];

    const responseText = await chatCompletion(messages, {
      temperature: 0.3,
      max_tokens: 4000,
    });

    // ── Parse JSON ──
    let evaluation: Record<string, unknown> = {};
    try {
      const jsonStart = responseText.indexOf("{");
      const jsonEnd = responseText.lastIndexOf("}") + 1;
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        evaluation = JSON.parse(responseText.slice(jsonStart, jsonEnd));
      }
    } catch {
      evaluation = { raw_response: responseText, parse_error: true };
    }

    // ── Validate and normalize scores against rubric ranges ──
    const competencyScores = (evaluation.competency_scores ?? {}) as Record<
      string,
      { earned: number; max: number; level?: string }
    >;
    let totalEarned = 0;

    for (const r of rubrics) {
      const score = competencyScores[r.id];
      if (!score) continue;

      // Clamp score to valid range [0, max_points]
      score.earned = Math.max(0, Math.min(score.earned ?? 0, r.max_points));
      score.max = r.max_points;

      // Set the correct performance level based on where the score falls
      score.level = getPerformanceLevel(score.earned, r);

      totalEarned += score.earned;
    }

    // ── Map to the evaluations table columns using db_column from rubric ──
    const dbScores: Record<string, number | null> = {};
    for (const r of rubrics) {
      const score = competencyScores[r.id];
      dbScores[r.db_column] = score?.earned ?? null;
    }

    return new Response(
      JSON.stringify({
        evaluation,
        total_score: totalEarned,
        max_score: totalMax,
        percentage: totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0,
        db_scores: dbScores,
        rubric_domains: rubrics.map((r) => ({
          id: r.id,
          name: r.name,
          max_points: r.max_points,
          db_column: r.db_column,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Evaluator agent error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
