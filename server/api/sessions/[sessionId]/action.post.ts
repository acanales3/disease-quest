/**
 * POST /api/sessions/:sessionId/action
 * Proxies student actions to the orchestrator edge function.
 */
import { defineEventHandler, createError, getRouterParam, readBody } from "h3";
import {
  serverSupabaseClient,
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from "#supabase/server";

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
    .select("id, user_id, status")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (sessionErr || !session) {
    throw createError({ statusCode: 404, message: "Session not found" });
  }

  if (session.status === "completed" || session.status === "abandoned") {
    throw createError({
      statusCode: 400,
      message: "Session is already completed",
    });
  }

  const body = await readBody(event);
  const { actionType, payload } = body;

  if (!actionType) {
    throw createError({ statusCode: 400, message: "actionType is required" });
  }

  // Call the orchestrator edge function
  const config = useRuntimeConfig();
  const supabaseUrl =
    process.env.SUPABASE_URL || config.public?.supabase?.url || "";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    "";
  console.log(
    "[action] serviceKey present:",
    !!serviceKey,
    "url:",
    supabaseUrl,
  );

  if (!supabaseUrl || !serviceKey) {
    throw createError({
      statusCode: 500,
      message:
        "Supabase configuration missing (SUPABASE_URL or SUPABASE_SERVICE_KEY)",
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

  // Save evaluation from Nuxt server side for reliability
  if (actionType === "end_case" && result?.evaluation) {
    console.log(
      "[action/end_case] Evaluation received, saving from Nuxt server...",
    );
    try {
      const serviceClient = serverSupabaseServiceRole(event);

      const { data: fullSession } = await serviceClient
        .from("case_sessions")
        .select("user_id, case_id")
        .eq("id", sessionId)
        .single();

      if (fullSession) {
        const sessionUserId = fullSession.user_id;
        const caseId = fullSession.case_id;
        const evalData = result.evaluation;
        const dbScores = result.db_scores || evalData?.db_scores;

        console.log(
          "[action/end_case] user_id:",
          sessionUserId,
          "case_id:",
          caseId,
          "session_id:",
          sessionId,
        );
        console.log("[action/end_case] db_scores:", JSON.stringify(dbScores));

        if (dbScores && Object.keys(dbScores).length > 0) {
          // Delete any existing evaluation for this session to prevent duplicates 
          // (e.g., if end_case is triggered multiple times)
          await serviceClient
            .from("evaluations")
            .delete()
            .eq("session_id", sessionId);

          const evalPayload = {
            user_id: sessionUserId,
            case_id: caseId,
            session_id: sessionId,
            ...dbScores,
            reflection_document: JSON.stringify(evalData),
          };
          console.log(
            "[action/end_case] Inserting evaluation with keys:",
            Object.keys(evalPayload),
          );

          const { data: insertedEval, error: evalErr } = await serviceClient
            .from("evaluations")
            .insert(evalPayload)
            .select();

          if (evalErr) {
            console.error(
              "[action/end_case] EVALUATION INSERT FAILED:",
              evalErr.message,
              evalErr.details,
              evalErr.hint,
              evalErr.code,
            );
          } else {
            console.log(
              "[action/end_case] Evaluation saved successfully, id:",
              (insertedEval as any)?.[0]?.id,
            );
          }
        } else {
          console.warn(
            "[action/end_case] No db_scores in result. Keys:",
            Object.keys(result),
          );
        }
      } else {
        console.error(
          "[action/end_case] Could not load session for evaluation save",
        );
      }
    } catch (evalSaveErr: any) {
      console.error(
        "[action/end_case] Exception saving evaluation:",
        evalSaveErr.message,
      );
    }
  }

  return result;
});
