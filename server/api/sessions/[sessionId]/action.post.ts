/**
 * POST /api/sessions/:sessionId/action
 * Proxies student actions to the orchestrator edge function.
 *
 * Body: {
 *   actionType: string,
 *   payload: { content?, testId?, rationale?, treatment?, differential?, diagnosis?, reasoning?, minutes? }
 * }
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
    throw createError({ statusCode: 400, message: "Session ID is required" });
  }

  // Verify session ownership
  const { data: session, error: sessionErr } = await client
    .from("case_sessions")
    .select("id, student_id, status")
    .eq("id", sessionId)
    .eq("student_id", userId)
    .single();

  if (sessionErr || !session) {
    throw createError({ statusCode: 404, message: "Session not found" });
  }

  if (session.status === "completed" || session.status === "abandoned") {
    throw createError({ statusCode: 400, message: "Session is already completed" });
  }

  const body = await readBody(event);
  const { actionType, payload } = body;

  if (!actionType) {
    throw createError({ statusCode: 400, message: "actionType is required" });
  }

  // Call the orchestrator edge function
  const config = useRuntimeConfig();
  const supabaseUrl = process.env.SUPABASE_URL || config.public?.supabase?.url || "";
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || "";

  if (!supabaseUrl || !serviceKey) {
    throw createError({
      statusCode: 500,
      message: "Supabase configuration missing (SUPABASE_URL or SUPABASE_SERVICE_KEY)",
    });
  }

  const orchestratorUrl = `${supabaseUrl}/functions/v1/orchestrator`;

  const response = await fetch(orchestratorUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      sessionId,
      actionType,
      payload: payload ?? {},
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Orchestrator error:", response.status, errText);
    throw createError({
      statusCode: response.status,
      message: `Orchestrator error: ${errText}`,
    });
  }

  const result = await response.json();
  return result;
});
