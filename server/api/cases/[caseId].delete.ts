import { createError, defineEventHandler, getRouterParam } from "h3";
import {
  serverSupabaseClient,
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);
  const serviceClient = serverSupabaseServiceRole(event);

  const userId = (user as any)?.id || (user as any)?.sub;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const caseIdParam = getRouterParam(event, "caseId");
  const caseId = Number(caseIdParam);
  if (!caseIdParam || Number.isNaN(caseId)) {
    throw createError({ statusCode: 400, message: "Invalid case ID" });
  }

  const { data: userProfile, error: profileError } = (await client
    .from("users")
    .select("role")
    .eq("id", userId)
    .single()) as { data: { role: string } | null; error: any };

  if (profileError || !userProfile) {
    throw createError({
      statusCode: 403,
      message: "Forbidden: User profile not found",
    });
  }

  if (userProfile.role?.toUpperCase() !== "ADMIN") {
    throw createError({
      statusCode: 403,
      message: "Forbidden: Only admins can delete cases",
    });
  }

  const { data: targetCase, error: caseFetchError } = await serviceClient
    .from("cases")
    .select("id, name")
    .eq("id", caseId)
    .single();

  if (caseFetchError) {
    const isMissing = caseFetchError.code === "PGRST116";
    throw createError({
      statusCode: isMissing ? 404 : 500,
      message: isMissing
        ? "Case not found"
        : `Failed to fetch case: ${caseFetchError.message}`,
    });
  }

  const { error: deleteEvaluationsError } = await serviceClient
    .from("evaluations")
    .delete()
    .eq("case_id", caseId);

  if (deleteEvaluationsError) {
    throw createError({
      statusCode: 500,
      message: `Failed to delete case evaluations: ${deleteEvaluationsError.message}`,
    });
  }

  const { error: deleteAssignmentsError } = await serviceClient
    .from("classroom_cases")
    .delete()
    .eq("case_id", caseId);

  if (deleteAssignmentsError) {
    throw createError({
      statusCode: 500,
      message: `Failed to delete classroom case assignments: ${deleteAssignmentsError.message}`,
    });
  }

  const { error: deleteSessionsError } = await serviceClient
    .from("case_sessions")
    .delete()
    .eq("case_id", caseId);

  if (deleteSessionsError) {
    throw createError({
      statusCode: 500,
      message: `Failed to delete case sessions: ${deleteSessionsError.message}`,
    });
  }

  const { error: deleteCaseError } = await serviceClient
    .from("cases")
    .delete()
    .eq("id", caseId);

  if (deleteCaseError) {
    throw createError({
      statusCode: 500,
      message: `Failed to delete case: ${deleteCaseError.message}`,
    });
  }

  return {
    success: true,
    message: `Case "${targetCase.name}" has been deleted.`,
  };
});
