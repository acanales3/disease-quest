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
import { serverSupabaseClient, serverSupabaseServiceRole, serverSupabaseUser } from "#supabase/server";

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

  // If this was an end_case action, save the evaluation from the Nuxt server
  // so we get full logging and bypass any edge function DB issues
  if (actionType === "end_case" && result?.evaluation) {
    console.log("[action/end_case] Evaluation received, saving from Nuxt server...");
    try {
      const serviceClient = serverSupabaseServiceRole(event);

      // Load session to get case_id
      const { data: fullSession } = await serviceClient
        .from("case_sessions")
        .select("student_id, case_id")
        .eq("id", sessionId)
        .single();

      if (fullSession) {
        const studentId = fullSession.student_id;
        const caseId = fullSession.case_id;
        const evalData = result.evaluation;
        const dbScores = result.db_scores || evalData?.db_scores;

        console.log("[action/end_case] student_id:", studentId, "case_id:", caseId);
        console.log("[action/end_case] db_scores:", JSON.stringify(dbScores));

        if (dbScores && Object.keys(dbScores).length > 0) {
          // Delete existing evaluation for this student+case
          const { error: delErr } = await serviceClient
            .from("evaluations")
            .delete()
            .eq("student_id", studentId)
            .eq("case_id", caseId);

          if (delErr) {
            console.error("[action/end_case] Delete old evaluation failed:", delErr.message, delErr.details, delErr.hint);
          }

          // Insert new evaluation
          const evalPayload = {
            student_id: studentId,
            case_id: caseId,
            ...dbScores,
            reflection_document: JSON.stringify(evalData),
          };
          console.log("[action/end_case] Inserting evaluation with keys:", Object.keys(evalPayload));

          const { data: insertedEval, error: evalErr } = await serviceClient
            .from("evaluations")
            .insert(evalPayload)
            .select();

          if (evalErr) {
            console.error("[action/end_case] EVALUATION INSERT FAILED:", evalErr.message, evalErr.details, evalErr.hint, evalErr.code);
          } else {
            console.log("[action/end_case] Evaluation saved successfully, id:", (insertedEval as any)?.[0]?.id);
          }
        } else {
          console.warn("[action/end_case] No db_scores found in evaluation result — checking result structure:", Object.keys(result));
        }

        // Also upsert student_cases
        const { error: scErr } = await serviceClient
          .from("student_cases")
          .upsert({
            student_id: studentId,
            case_id: caseId,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          } as any);

        if (scErr) {
          console.error("[action/end_case] student_cases upsert failed:", scErr.message);
        }
      } else {
        console.error("[action/end_case] Could not load session for evaluation save");
      }
    } catch (evalSaveErr: any) {
      console.error("[action/end_case] Exception saving evaluation:", evalSaveErr.message);
    }
  }

  return result;
});
