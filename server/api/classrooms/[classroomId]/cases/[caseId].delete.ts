import {
  serverSupabaseUser,
  serverSupabaseServiceRole,
} from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  // @ts-ignore
  const userId = user.id || user.sub;
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const classroomId = Number(getRouterParam(event, "classroomId"));
  const caseId = Number(getRouterParam(event, "caseId"));

  if (!classroomId || isNaN(classroomId) || !caseId || isNaN(caseId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Valid classroomId and caseId are required",
    });
  }

  const client = serverSupabaseServiceRole(event);

  const { data: userProfile } = await (client as any)
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  const role = userProfile?.role?.toUpperCase();
  if (role !== "ADMIN" && role !== "INSTRUCTOR") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  if (role === "INSTRUCTOR") {
    const { data: classroom } = await (client as any)
      .from("classrooms")
      .select("instructor_id")
      .eq("id", classroomId)
      .single();

    if (!classroom || classroom.instructor_id !== userId) {
      throw createError({
        statusCode: 403,
        statusMessage: "You can only manage your own classrooms",
      });
    }
  }

  const { error } = await (client as any)
    .from("classroom_cases")
    .delete()
    .eq("classroom_id", classroomId)
    .eq("case_id", caseId);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to remove case: ${error.message}`,
    });
  }

  return { success: true };
});
