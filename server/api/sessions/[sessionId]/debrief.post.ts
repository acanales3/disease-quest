/**
 * POST /api/sessions/:sessionId/debrief
 * Chat with the evaluator agent about your performance.
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

  // Load session — column is user_id after migration
  const { data: session, error: sessionErr } = (await client
    .from("case_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single()) as { data: Record<string, unknown> | null; error: any };

  if (sessionErr || !session) {
    throw createError({ statusCode: 404, message: "Session not found" });
  }

  // Load case content
  const { data: caseRow } = (await client
    .from("cases")
    .select("name, content")
    .eq("id", session.case_id as number)
    .single()) as {
    data: { name: string; content: Record<string, unknown> } | null;
  };

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

  const actionSummary = (actions ?? [])
    .map(
      (a: Record<string, unknown>) =>
        `[${a.elapsed_minutes}min] ${a.actor} ${a.action_type} → ${a.target ?? ""}`,
    )
    .join("\n");

  const evalSummary = evaluationData
    ? JSON.stringify(evaluationData, null, 1).slice(0, 3000)
    : "No evaluation data provided";

  const conversationSummary = (messages ?? [])
    .slice(-20)
    .map(
      (m: Record<string, unknown>) =>
        `${(m.role as string).toUpperCase()}: ${(m.content as string).slice(0, 200)}`,
    )
    .join("\n");

  const priorDebrief = (debriefMessages ?? [])
    .filter(
      (m: Record<string, unknown>) =>
        (m.content as string).includes("[Debrief]") || m.role === "evaluator",
    )
    .slice(-10)
    .map(
      (m: Record<string, unknown>) =>
        `${m.role === "student" ? "Student" : "Evaluator"}: ${(m.content as string).replace("[Debrief] ", "")}`,
    )
    .join("\n");

  const systemPrompt = `You are a supportive medical education evaluator having a debrief conversation with a user who just completed a clinical simulation.

CASE: ${caseRow?.name ?? "Unknown"}
CORRECT DIAGNOSIS: ${caseRow?.content?.correct_diagnosis ?? "Unknown"}

WHAT THE USER DID (action log):
${actionSummary || "No actions recorded"}

CONVERSATION WITH PATIENT (last 20 messages):
${conversationSummary || "No conversation"}

EVALUATION RESULTS:
${evalSummary}

${priorDebrief ? `PRIOR DEBRIEF CONVERSATION:\n${priorDebrief}` : ""}

YOUR ROLE:
- Help the user understand their evaluation
- Explain what they did well and why
- Explain what they missed and why it matters clinically
- If they ask "what should I have done?", give specific, actionable advice
- Connect feedback to clinical reasoning principles
- Be encouraging but honest
- Use specific examples from their performance
- If they ask about a specific score, explain exactly what earned/lost points
- You CAN reveal the correct diagnosis and explain the full clinical picture now (case is over)

TONE: Warm, constructive, educational. Like a supportive attending doing a post-case debrief.`;

  const config = useRuntimeConfig(event);
  const supabaseUrl =
    process.env.SUPABASE_URL || config.public?.supabase?.url || "";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    "";

  if (!supabaseUrl || !serviceKey) {
    throw createError({
      statusCode: 500,
      message:
        "Supabase configuration missing (SUPABASE_URL or SUPABASE_SERVICE_KEY)",
    });
  }

  const edgeRes = await fetch(`${supabaseUrl}/functions/v1/debrief-agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    },
    body: JSON.stringify({
      question,
      systemPrompt,
    }),
  });

  if (!edgeRes.ok) {
    const errText = await edgeRes.text().catch(() => "");
    console.error("Debrief edge function error:", edgeRes.status, errText);
    throw createError({ statusCode: 502, message: "Debrief generation failed" });
  }

  const edgeData = await edgeRes.json().catch(() => ({}));
  const responseText =
    edgeData?.response ?? "I couldn't generate a debrief response.";

  await (client.from("session_messages") as any).insert([
    {
      session_id: sessionId,
      role: "student",
      content: `[Debrief] ${question}`,
    },
    { session_id: sessionId, role: "evaluator", content: responseText },
  ]);

  return { response: responseText };
});
