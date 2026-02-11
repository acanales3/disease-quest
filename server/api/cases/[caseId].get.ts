/**
 * GET /api/cases/:caseId
 * Returns case data including content for the introduction page.
 */
import { defineEventHandler, createError, getRouterParam } from "h3";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);
  // @ts-ignore
  const userId = user?.id || user?.sub;

  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const caseId = getRouterParam(event, "caseId");
  if (!caseId) {
    throw createError({ statusCode: 400, message: "Case ID is required" });
  }

  const { data: rawData, error } = await client
    .from("cases")
    .select("id, name, description, content, created_at")
    .eq("id", parseInt(caseId))
    .single() as { data: { id: number; name: string; description: string | null; content: Record<string, unknown> | null; created_at: string } | null; error: any };

  if (error || !rawData) {
    throw createError({ statusCode: 404, message: "Case not found" });
  }

  const data = rawData;

  // Build a frontend-friendly response
  const content = data.content;

  // Strip diagnosis from the title so we don't spoil it for students
  let safeTitle = (content?.title ?? data.name) as string;
  if (safeTitle.includes("—")) safeTitle = safeTitle.split("—")[0].trim();
  if (safeTitle.includes(" - ")) safeTitle = safeTitle.split(" - ")[0].trim();

  // Build a safe description that doesn't mention the diagnosis
  const patientState = (content?.initial_patient_state ?? {}) as Record<string, unknown>;
  const safeDescription = patientState.history_of_present_illness ?? data.description ?? "";

  // Introduction content from DB (paragraphs + instructions)
  const introduction = (content?.introduction ?? {}) as Record<string, unknown>;

  return {
    id: data.id,
    name: data.name,
    created_at: data.created_at,
    // Safe metadata (diagnosis stripped)
    title: safeTitle,
    description: safeDescription,
    setting: content?.setting ?? null,
    estimated_minutes: content?.estimated_minutes ?? null,
    learner_level: content?.learner_level ?? [],
    // Introduction content (dynamic from DB)
    introduction_paragraphs: (introduction.paragraphs ?? []) as string[],
    introduction_instructions: (introduction.instructions ?? []) as string[],
    introduction_video: (introduction.video_url ?? null) as string | null,
    // Initial patient info (safe for student to see)
    patient_name: patientState.name ?? null,
    patient_age: patientState.age_months
      ? `${patientState.age_months} months`
      : null,
    chief_complaint: patientState.chief_complaint ?? null,
    // Interventions & tests list (names only, for UI)
    available_tests: ((content?.diagnostic_tests ?? []) as Array<Record<string, unknown>>).map(
      (t) => ({ id: t.id, name: t.display_name, cost_points: t.cost_points })
    ),
    available_interventions: ((content?.interventions ?? []) as Array<Record<string, unknown>>).map(
      (i) => ({ id: i.id, name: i.display_name, options: i.options ?? [] })
    ),
  };
});
