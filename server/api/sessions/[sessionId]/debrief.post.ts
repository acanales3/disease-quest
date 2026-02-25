/**
 * POST /api/sessions/:sessionId/debrief
 * Chat with the evaluator agent about your performance.
 * Sends the full session context + evaluation + student question.
 *
 * Body: { question: string, evaluationData?: Record<string, unknown> }
 */
import { defineEventHandler, createError, getRouterParam, readBody } from "h3";
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
    throw createError({ statusCode: 400, message: "Session ID required" });
  }

  const body = await readBody(event);
  const { question, evaluationData } = body;

  if (!question) {
    throw createError({ statusCode: 400, message: "question is required" });
  }

  // Load session
  const { data: session } = (await client
    .from("case_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("student_id", userId)
    .single()) as { data: Record<string, unknown> | null; error: unknown };

  if (!session) {
    throw createError({ statusCode: 404, message: "Session not found" });
  }

  // Load case content
  const { data: caseRow } = (await client
    .from("cases")
    .select("name, content")
    .eq("id", session.case_id as number)
    .single()) as { data: { name: string; content: Record<string, unknown> } | null; error: unknown };

  // Load full conversation history
  const { data: messages } = await client
    .from("session_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  // Load action log
  const { data: actions } = await client
    .from("session_actions")
    .select("actor, action_type, target, elapsed_minutes")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  // Load prior debrief messages
  const { data: debriefMessages } = await client
    .from("session_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .in("role", ["student", "evaluator"])
    .order("created_at", { ascending: true });

  // Build context summary
  const actionSummary = (actions ?? [])
    .map((a: Record<string, unknown>) => `[${a.elapsed_minutes}min] ${a.actor} ${a.action_type} → ${a.target ?? ""}`)
    .join("\n");

  const evalSummary = evaluationData
    ? JSON.stringify(evaluationData, null, 1).slice(0, 3000)
    : "No evaluation data provided";

  const conversationSummary = (messages ?? [])
    .slice(-20)
    .map((m: Record<string, unknown>) => `${(m.role as string).toUpperCase()}: ${(m.content as string).slice(0, 200)}`)
    .join("\n");

  const priorDebrief = (debriefMessages ?? [])
    .filter((m: Record<string, unknown>) => (m.content as string).includes("[Debrief]") || m.role === "evaluator")
    .slice(-10)
    .map((m: Record<string, unknown>) => `${m.role === "student" ? "Student" : "Evaluator"}: ${(m.content as string).replace("[Debrief] ", "")}`)
    .join("\n");

  // Build the system prompt
  const systemPrompt = `You are a supportive medical education evaluator having a debrief conversation with a student who just completed a clinical simulation.

CASE: ${caseRow?.name ?? "Unknown"}
CORRECT DIAGNOSIS: ${caseRow?.content?.correct_diagnosis ?? "Unknown"}

WHAT THE STUDENT DID (action log):
${actionSummary || "No actions recorded"}

CONVERSATION WITH PATIENT (last 20 messages):
${conversationSummary || "No conversation"}

EVALUATION RESULTS:
${evalSummary}

${priorDebrief ? `PRIOR DEBRIEF CONVERSATION:\n${priorDebrief}` : ""}

YOUR ROLE:
- Help the student understand their evaluation
- Explain what they did well and why
- Explain what they missed and why it matters clinically
- If they ask "what should I have done?", give specific, actionable advice
- Connect feedback to clinical reasoning principles
- Be encouraging but honest
- Use specific examples from their performance
- If they ask about a specific score, explain exactly what earned/lost points
- You CAN reveal the correct diagnosis and explain the full clinical picture now (case is over)

TONE: Warm, constructive, educational. Like a supportive attending doing a post-case debrief.`;

  // Call OpenAI
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || "";

  const openaiKey = process.env.OPENAI_API_KEY;

  // If we have the key directly, call OpenAI; otherwise proxy through edge function
  let responseText = "";

  if (openaiKey) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.7,
        max_tokens: 1500,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
      }),
    });

    if (!res.ok) {
      throw createError({ statusCode: 502, message: "AI service error" });
    }

    const data = await res.json();
    responseText = data.choices?.[0]?.message?.content ?? "I couldn't generate a response.";
  } else {
    // Fallback: call through Supabase edge function
    // This is a simplified fallback — in production you'd want a dedicated debrief edge function
    responseText = "Debrief chat requires OPENAI_API_KEY to be set in the Nuxt server environment.";
  }

  // Save messages to DB
  await (client.from("session_messages") as any).insert([
    { session_id: sessionId, role: "student", content: `[Debrief] ${question}` },
    { session_id: sessionId, role: "evaluator", content: responseText },
  ]);

  return { response: responseText };
});
