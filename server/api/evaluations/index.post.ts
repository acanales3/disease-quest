// index.post.ts api/evaluations
import { defineEventHandler, createError, readBody } from "h3";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

// All valid score columns in the evaluations table
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
  // ── Auth ──────────────────────────────────────────────────────────────────
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);
  // @ts-ignore — Supabase user typing varies between versions
  const userId: string | undefined = user?.id ?? user?.sub;

  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  // ── Body ──────────────────────────────────────────────────────────────────
  const body = await readBody(event);
  const { caseId, scores, reflectionDocument } = body as {
    caseId: number;
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

  // ── Validate & sanitise scores (must be 0.0–1.0 decimals or null) ─────────
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
    // Clamp to [0, 1] and round to 3 decimal places
    sanitisedScores[col] =
      Math.round(Math.max(0, Math.min(1, n)) * 1000) / 1000;
  }

  // ── Upsert (atomic) — single operation keyed on (user_id, case_id) ────────
  // previously this was a delete then insert to get a fresh auto-increment id,
  // but that created a data-loss window if the server crashed between the two
  // operations. upsert is atomic and sufficient for this use case.
  const upsertPayload: Record<string, unknown> = {
    user_id: userId,
    case_id: caseId,
    ...sanitisedScores,
  };
  if (reflectionDocument) {
    upsertPayload.reflection_document = reflectionDocument;
  }

  const { data, error: insertErr } = await client
    .from("evaluations")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(upsertPayload as any, { onConflict: "user_id,case_id" })
    .select()
    .single();

  if (insertErr) {
    console.error("[POST /api/evaluations] upsert error:", insertErr.message);
    throw createError({
      statusCode: 500,
      message: `Failed to save evaluation: ${insertErr.message}`,
    });
  }

  return {
    success: true,
    evaluation: data,
  };
});
