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
 * Build the rubric text for the LLM prompt from the case's evaluation_rubrics.
 * Also builds the expected JSON output keys.
 */
function formatRubric(rubrics: RubricDomain[]): { rubricText: string; scoreKeys: string } {
  const lines: string[] = [];
  const jsonKeys: string[] = [];

  for (const r of rubrics) {
    lines.push(`\n${r.name} (${r.id}) — ${r.max_points} points:`);
    lines.push(`  Emerging  (${r.emerging_range[0]}–${r.emerging_range[1]}): ${r.emerging_description}`);
    lines.push(`  Developing (${r.developing_range[0]}–${r.developing_range[1]}): ${r.developing_description}`);
    lines.push(`  Proficient (${r.proficient_range[0]}–${r.proficient_range[1]}): ${r.proficient_description}`);
    lines.push(`  Exemplary  (${r.exemplary_range[0]}–${r.exemplary_range[1]}): ${r.exemplary_description}`);

    jsonKeys.push(
      `    "${r.id}": { "earned": <0-${r.max_points}>, "max": ${r.max_points}, "strengths": ["..."], "improvements": ["..."], "feedback": "..." }`
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

    // ── Build prompt ──
    const evalPrompt = `Evaluate this student's performance in the clinical simulation.

CASE: ${caseContent.title ?? "Unknown"}
CORRECT DIAGNOSIS: ${caseContent.correct_diagnosis ?? "Unknown"}
KEY FINDINGS: ${((caseContent.key_findings ?? []) as string[]).join(", ")}

EVALUATION RUBRIC (use these EXACT domains, IDs, and point ranges):
${rubricText}

Total possible points: ${totalMax}

INTERACTION LOG:
${logSummary || "No actions recorded"}

STUDENT'S FINAL DIAGNOSIS: ${sessionData.finalDiagnosis ?? "Not provided"}
STUDENT'S REASONING: ${sessionData.finalDiagnosisReasoning ?? "Not provided"}

DIFFERENTIAL DIAGNOSIS HISTORY:
${diffHistory || "No differential diagnosis recorded"}

TESTS ORDERED:
${testsText || "No tests ordered"}

TIMING ANALYSIS:
- Total case time: ${sessionData.elapsedMinutes} minutes
- Antibiotics ordered: ${sessionData.flags?.antibiotics_ordered ? "Yes" : "No"}
- Cultures before antibiotics: ${sessionData.flags?.cultures_before_antibiotics ? "Yes" : "No/Unknown"}
- Meningitis suspected: ${sessionData.flags?.meningitis_suspected ? "Yes" : "No"}
- Shock recognized: ${sessionData.flags?.shock_recognized ? "Yes" : "No"}
- Treatments given: ${(sessionData.treatmentsAdministered ?? []).join(", ") || "None"}

INSTRUCTIONS:
- Score each domain using the EXACT score ranges from the rubric.
- Evaluate PROCESS, not just outcomes.
- Credit good reasoning even if outcome was imperfect.
- Be specific – cite moments from the interaction log.
- For Reflection and Metacognition: evaluate based on the student's demonstrated self-awareness, reasoning transparency, and any reflective statements during the case.

Return valid JSON with this EXACT structure:
{
  "competency_scores": {
${scoreKeys}
  },
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": ["Area 1", "Area 2", "Area 3"],
  "missed_critical_actions": [
    { "action": "...", "importance": "high", "consequence": "...", "should_have_done": "...", "when": "...", "learning_point": "..." }
  ],
  "reflection_prompts": [
    { "prompt": "...", "context": "...", "competencies": ["..."] }
  ],
  "overall_feedback": "Summary narrative...",
  "reasoning_analysis": "Detailed analysis of clinical reasoning process..."
}`;

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are an expert medical education evaluator using a structured rubric. Evaluate the student's clinical reasoning PROCESS, not just outcomes. Be constructive and specific. Return valid JSON only.`,
      },
      { role: "user", content: evalPrompt },
    ];

    const responseText = await chatCompletion(messages, {
      temperature: 0.3,
      max_tokens: 3000,
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

    // ── Calculate total score from rubric domains ──
    const competencyScores = (evaluation.competency_scores ?? {}) as Record<
      string,
      { earned: number; max: number }
    >;
    let totalEarned = 0;
    for (const score of Object.values(competencyScores)) {
      totalEarned += score.earned ?? 0;
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
