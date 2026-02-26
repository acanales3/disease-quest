/**
 * GET /api/cases/:caseId
 *
 * Returns the full content of a single case, used by the introduction page
 * to render the title, story, patient info, instructions, and video.
 */
import { defineEventHandler, createError, getRouterParam } from "h3";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);

  const userId = (user as any)?.id || (user as any)?.sub;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const caseId = getRouterParam(event, "caseId");
  if (!caseId) {
    throw createError({ statusCode: 400, message: "Case ID required" });
  }

  const { data, error } = await client
    .from("cases")
    .select("id, name, content")
    .eq("id", parseInt(caseId, 10))
    .single();

  if (error || !data) {
    throw createError({ statusCode: 404, message: "Case not found" });
  }

  // Merge top-level fields from content with the case row so the introduction
  // page can access caseData.title, caseData.patient_name, etc. directly.
  const content = (data.content ?? {}) as Record<string, unknown>;

  return {
    id: data.id,
    name: data.name,
    // Content fields the introduction page uses:
    title: content.title ?? data.name,
    setting: content.setting ?? null,
    estimated_minutes: content.estimated_minutes ?? null,
    learner_level: content.learner_level ?? [],
    description: content.description ?? null,
    introduction_paragraphs: content.introduction_paragraphs ?? [],
    introduction_instructions: content.introduction_instructions ?? [],
    introduction_video: content.introduction_video ?? null,
    video_url: content.video_url ?? null,
    patient_name: content.patient_name ?? null,
    patient_age: content.patient_age ?? null,
    chief_complaint: content.chief_complaint ?? null,
  };
});
