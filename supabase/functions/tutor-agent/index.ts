/**
 * Tutor Agent – Supabase Edge Function
 *
 * Socratic instructional agent. Guides without giving answers.
 * Optionally queries Pinecone for RAG.
 * Called internally by the orchestrator.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { chatCompletion, type ChatMessage } from "../_shared/openai.ts";

interface TutorRequest {
  question: string;
  caseContent: Record<string, unknown>;
  sessionContext: {
    elapsedMinutes: number;
    phase: string;
    differential: Array<{ diagnosis: string; likelihood?: string }>;
    testsOrdered: string[];
    testResults: Array<{ test: string; results: Record<string, unknown> }>;
    treatmentsGiven: string[];
    vitals: Record<string, unknown>;
    patientStatus: Record<string, unknown>;
    conversationHistory: Array<{ role: string; content: string }>;
  };
}

function buildSystemPrompt(caseContent: Record<string, unknown>): string {
  const objectives = (caseContent.learning_objectives as Array<{ id: string; text: string }>) ?? [];
  const objectivesText = objectives.map((o) => `- ${o.id}: ${o.text}`).join("\n");

  // Build available actions list
  const tests = (caseContent.diagnostic_tests as Array<{ id: string; display_name: string }>) ?? [];
  const testsText = tests.map((t) => `  - ${t.display_name}`).join("\n");

  const interventions = (caseContent.interventions as Array<{ id: string; display_name: string }>) ?? [];
  const interventionsText = interventions.map((i) => `  - ${i.display_name}`).join("\n");

  return `You are a supportive clinical instructor helping a medical student work through a pediatric case in a simulation. You're friendly, encouraging, and want the student to succeed.

CASE CONTEXT:
- Setting: ${caseContent.setting ?? "Unknown"}
- Difficulty: ${caseContent.difficulty ?? "Unknown"}
- Internal case label (may reveal the diagnosis): ${caseContent.title ?? "Unknown"}

DIAGNOSIS DISCLOSURE RULES (CRITICAL):
- You MAY use the internal case label as your private knowledge to coach effectively.
- You MUST NOT state the diagnosis directly (or name it) unless:
  1) the student has explicitly proposed it first, OR
  2) the student explicitly asks you to reveal the diagnosis multiple times (3+ separate requests).
- Until then, speak in categories (e.g., "serious CNS infection", "invasive bacterial infection") and focus on reasoning.

LEARNING OBJECTIVES:
${objectivesText}

AVAILABLE ACTIONS IN THE SIMULATION:
The student can do the following in the simulation interface. When giving advice, reference these SPECIFIC actions:

Interview Tab: Talk to the patient's family to gather history
Exam Tab: Perform a physical examination
Orders Tab - Available tests:
${testsText || "  (none defined)"}
Treatment Tab - Available interventions:
${interventionsText || "  (none defined)"}
DDx Tab: Build and update a differential diagnosis list
Diagnosis Tab: Submit a final diagnosis with reasoning
+5 min button: Advance simulation time
Ask Mentor: Talk to you (the mentor)
End Case: Finish and get evaluated

YOUR TEACHING STYLE:
You are a helpful mentor, not a gatekeeper. Your job is to GUIDE the student toward the right answer.

CRITICAL RULES FOR RESPONSES:
1. When the student asks "what should I do?" or "what's next?", give SPECIFIC actions they can take in the simulation. For example: "Go to the Orders tab and order a CBC and Blood Cultures" or "Go to the Treatment tab and start empiric antibiotics."
2. Be warm and encouraging – acknowledge when they're on the right track
3. If they're missing something important, tell them EXACTLY what to do: which tab to go to, which test to order, which treatment to give
4. You CAN confirm correct reasoning ("Yes, that's exactly right because...")
5. You CAN point them toward the right category of answer
6. You CAN explain WHY something is important
7. Give concrete, actionable guidance – never vague
8. If the patient is deteriorating (shock, seizure), be URGENT and tell them exactly what treatments to administer immediately

CRITICAL CONSTRAINT:
You MUST ONLY recommend actions that exist in the lists above. NEVER suggest medications, tests, or interventions that are NOT in the available lists. For example, do NOT suggest "acetaminophen" or "ibuprofen" if they are not in the Treatment tab list. If a student asks about something not available, explain that it's not available in this simulation and redirect them to what IS available.

EXAMPLE GOOD RESPONSES:
- "The elevated heart rate is likely from the fever and infection. Go to the Treatment tab and start empiric antibiotics (Ceftriaxone + Vancomycin) — this targets the underlying cause. Also consider a Fluid bolus if you're concerned about perfusion."
- "This looks like shock! Go to the Treatment tab RIGHT NOW and administer a Fluid bolus for shock (20 mL/kg NS or LR). If BP doesn't improve, come back and Initiate vasopressors (dopamine/epinephrine)."
- "Before starting antibiotics, go to the Orders tab and order Blood Cultures x2 first — cultures before antibiotics is a critical step."
- "Go to the DDx tab and build your differential. Think about what infections could cause fever + lethargy + petechiae in a 9-month-old."

WHAT YOU SHOULD AVOID:
- NEVER recommend medications or tests that are NOT in the available lists above
- Don't give generic advice like "monitor vitals" — say which specific test to order or treatment to give
- Don't say the final diagnosis outright (you can coach toward it)
- Don't be so vague that the student gets frustrated
- Don't give numbered lists of 5+ generic steps — be focused and direct

Remember: You want the student to learn AND succeed. Guide them with SPECIFIC actions from the available lists only.`;
}

function categorizeRequest(input: string): string {
  const lower = input.toLowerCase();
  if (["differential", "diagnosis", "what could", "what is"].some((w) => lower.includes(w)))
    return "differential";
  if (["why", "mechanism", "pathophys", "cause", "how does"].some((w) => lower.includes(w)))
    return "pathophysiology";
  if (["test", "order", "lab", "imaging", "workup"].some((w) => lower.includes(w)))
    return "diagnostic";
  if (["treat", "manage", "give", "medication", "antibiotic"].some((w) => lower.includes(w)))
    return "treatment";
  if (["interpret", "mean", "result", "finding", "value"].some((w) => lower.includes(w)))
    return "interpretation";
  return "general";
}

function countDiagnosisInsistence(msgs: string[]): number {
  const patterns = [
    /\bwhat(?:'s| is) (?:the )?diagnosis\b/i,
    /\btell me (?:the )?diagnosis\b/i,
    /\bjust tell me\b/i,
    /\bwhat does (?:she|he|the patient) have\b/i,
    /\bwhat(?:'s| is) wrong\b/i,
    /\bconfirm (?:the )?diagnosis\b/i,
  ];
  let count = 0;
  for (const m of msgs) {
    if (patterns.some((rx) => rx.test(m))) count++;
  }
  return count;
}

function studentProposedMeningitis(
  msgs: string[],
  differential: Array<{ diagnosis: string }>
): boolean {
  for (const m of msgs) {
    if (/\bmeningitis\b/i.test(m)) return true;
  }
  for (const dx of differential ?? []) {
    if ((dx.diagnosis ?? "").toLowerCase().includes("meningitis")) return true;
  }
  return false;
}

function redactDiagnosisTerms(text: string): string {
  const redactions: [RegExp, string][] = [
    [/\bacute bacterial meningitis\b/gi, "a serious CNS infection"],
    [/\bbacterial meningitis\b/gi, "a serious CNS infection"],
    [/\bmeningitis\b/gi, "a serious CNS infection"],
    [/\bstreptococcus pneumoniae\b/gi, "a likely invasive bacterial pathogen"],
    [/\bpneumococcal\b/gi, "a likely invasive bacterial"],
  ];
  let out = text;
  for (const [pat, repl] of redactions) {
    out = out.replace(pat, repl);
  }
  return out;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: TutorRequest = await req.json();
    const { question, caseContent, sessionContext } = body;

    const systemPrompt = buildSystemPrompt(caseContent);
    const helpCategory = categorizeRequest(question);

    // Build context string
    const ctxParts: string[] = [
      `Help category: ${helpCategory}`,
      `Phase: ${sessionContext.phase}`,
      `Elapsed: ${sessionContext.elapsedMinutes} min`,
    ];

    if (sessionContext.differential?.length) {
      ctxParts.push(
        `Student differential: ${sessionContext.differential.map((d) => d.diagnosis).join(", ")}`
      );
    }
    if (sessionContext.testsOrdered?.length) {
      ctxParts.push(`Tests ordered: ${sessionContext.testsOrdered.join(", ")}`);
    }
    if (sessionContext.treatmentsGiven?.length) {
      ctxParts.push(`Treatments given: ${sessionContext.treatmentsGiven.join(", ")}`);
    }
    if (sessionContext.vitals) {
      ctxParts.push(`Vitals: ${JSON.stringify(sessionContext.vitals)}`);
    }
    if (sessionContext.patientStatus) {
      ctxParts.push(`Patient status: ${JSON.stringify(sessionContext.patientStatus)}`);
    }

    // Diagnosis disclosure gating
    const studentMsgs = (sessionContext.conversationHistory ?? [])
      .filter((m) => m.role === "student")
      .map((m) => m.content);
    studentMsgs.push(question);

    const insistCount = countDiagnosisInsistence(studentMsgs);
    const proposed = studentProposedMeningitis(studentMsgs, sessionContext.differential ?? []);
    const allowDiagnosis = proposed || insistCount >= 3;

    ctxParts.push(`Diagnosis reveal allowed: ${allowDiagnosis}`);
    if (insistCount > 0) ctxParts.push(`Diagnosis request count: ${insistCount}`);

    // Format recent conversation for context
    const recentConv = (sessionContext.conversationHistory ?? []).slice(-15);
    const convText = recentConv
      .map((m) => {
        if (m.role === "student") return `Student: ${m.content}`;
        if (m.role === "patient") return `Patient/Family: ${m.content}`;
        if (m.role === "tutor") return `Tutor: ${m.content}`;
        return `System: ${m.content}`;
      })
      .join("\n");

    if (convText) ctxParts.push(`\nConversation so far:\n${convText}`);

    const messages: ChatMessage[] = [
      { role: "system", content: `${systemPrompt}\n\nCurrent Context:\n${ctxParts.join("\n")}` },
      { role: "user", content: question },
    ];

    let responseText = await chatCompletion(messages, { temperature: 0.7 });

    // Safety net: redact diagnosis terms if not allowed yet
    if (!allowDiagnosis) {
      responseText = redactDiagnosisTerms(responseText);
    }

    return new Response(
      JSON.stringify({
        response: responseText,
        help_category: helpCategory,
        rag_sources_used: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Tutor agent error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
