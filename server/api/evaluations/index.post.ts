// index.post.ts  —  /api/evaluations
import { defineEventHandler, createError, readBody } from "h3";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

const SCORE_COLUMNS = [
  "history_taking_synthesis",
  "physical_exam_interpretation",
  "differential_diagnosis_formulation",
  "diagnostic_tests",
  "management_reasoning",
  "communication_empathy",
  "reflection_metacognition",
] as const;

type ScoreColumn = (typeof SCORE_COLUMNS)[number];

export default defineEventHandler(async (event) => {
  // ── Auth ──────────────────────────────────────────────────────
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);
  // @ts-ignore
  const userId: string | undefined = user?.id ?? user?.sub;

  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  // ── Body ──────────────────────────────────────────────────────
  const body = await readBody(event);
  const { caseId, sessionId, scores, reflectionDocument } = body as {
    caseId: number;
    sessionId?: string | null;
    scores: Partial<Record<ScoreColumn, number | null>>;
    reflectionDocument?: string;
  };

  if (!caseId) {
    throw createError({ statusCode: 400, message: "caseId is required" });
  }
  if (!scores || typeof scores !== "object") {
    throw createError({
      statusCode: 400,
      message: "scores object is required",
    });
  }

  // ── Validate & sanitise scores (0.0–1.0 decimals or null) ────
  const sanitisedScores: Partial<Record<ScoreColumn, number | null>> = {};
  for (const col of SCORE_COLUMNS) {
    const raw = scores[col];
    if (raw === undefined || raw === null) {
      sanitisedScores[col] = null;
      continue;
    }
    const n = Number(raw);
    if (isNaN(n)) {
      throw createError({
        statusCode: 400,
        message: `Invalid score for ${col}: must be a number`,
      });
    }
    sanitisedScores[col] =
      Math.round(Math.max(0, Math.min(1, n)) * 1000) / 1000;
  }

  // ── Upsert strategy ───────────────────────────────────────────
  // • If a sessionId is provided: upsert on session_id (unique per attempt).
  //   This correctly creates a NEW row for each attempt rather than overwriting.
  // • If no sessionId (legacy / direct API calls): upsert on user_id+case_id
  //   (old behaviour — only one row per user per case).
  //   NOTE: The orchestrator already calls upsert on session_id, so this
  //   fallback path is mainly for external integrations or older clients.
  const upsertPayload: Record<string, unknown> = {
    user_id: userId,
    case_id: caseId,
    ...sanitisedScores,
  };

  if (sessionId) {
    upsertPayload.session_id = sessionId;
  }
  if (reflectionDocument) {
    upsertPayload.reflection_document = reflectionDocument;
  }

  const conflictTarget = sessionId ? "session_id" : "user_id,case_id";

  const { data, error: insertErr } = await client
    .from("evaluations")
    .upsert(upsertPayload as any, { onConflict: conflictTarget })
    .select()
    .single();

  if (insertErr) {
    console.error("[POST /api/evaluations] upsert error:", insertErr.message);
    throw createError({
      statusCode: 500,
      message: `Failed to save evaluation: ${insertErr.message}`,
    });
  }

  return { success: true, evaluation: data };
});
