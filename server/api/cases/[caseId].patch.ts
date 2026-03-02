import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
} from "h3";
import {
  serverSupabaseClient,
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from "#supabase/server";

interface UpdateCaseBody {
  name?: string;
  description?: string;
}

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
      message: "Forbidden: Only admins can edit cases",
    });
  }

  const body = (await readBody(event)) as UpdateCaseBody;
  const nextName = body?.name?.trim();
  const nextDescription = body?.description?.trim();

  if (!nextName || !nextDescription) {
    throw createError({
      statusCode: 400,
      message: "Both name and description are required",
    });
  }

  const { data: updatedCase, error: updateError } = await serviceClient
    .from("cases")
    .update({
      name: nextName,
      description: nextDescription,
    })
    .eq("id", caseId)
    .select("id, name, description")
    .single();

  if (updateError) {
    const isMissing = updateError.code === "PGRST116";
    throw createError({
      statusCode: isMissing ? 404 : 500,
      message: isMissing
        ? "Case not found"
        : `Failed to update case: ${updateError.message}`,
    });
  }

  return {
    success: true,
    case: updatedCase,
    message: `Case "${updatedCase.name}" has been updated.`,
  };
});
