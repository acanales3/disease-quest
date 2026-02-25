import {
  serverSupabaseUser,
  serverSupabaseServiceRole,
} from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = serverSupabaseServiceRole(event);

  // @ts-ignore
  const userId = user.id || user.sub;
  if (!userId) throw createError({ statusCode: 401, message: "Unauthorized" });

  const id = getRouterParam(event, "id");
  if (!id)
    throw createError({ statusCode: 400, message: "Student ID is required" });

  const { data: userProfile, error: profileError } = await client
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError || !userProfile)
    throw createError({
      statusCode: 403,
      message: "Forbidden: User profile not found",
    });

  const role = (userProfile as any).role?.toUpperCase();
  const isAdmin = role === "ADMIN";
  const isInstructor = role === "INSTRUCTOR";

  if (!isAdmin && !isInstructor)
    throw createError({ statusCode: 403, message: "Forbidden: access denied" });

  const query = getQuery(event);
  const classroomIdsParam = query.classroomIds as string | undefined;

  if (classroomIdsParam) {
    // --- UNENROLL: remove student from specific classrooms, keep account intact ---
    // Instructors can only unenroll from classrooms they own
    const classroomIds = classroomIdsParam
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    if (classroomIds.length === 0)
      throw createError({
        statusCode: 400,
        message: "No valid classroom IDs provided",
      });

    if (isInstructor) {
      // Verify the instructor owns all the classrooms being unenrolled from
      const { data: ownedClassrooms, error: ownerError } = await client
        .from("classrooms")
        .select("id")
        .eq("instructor_id", userId)
        .in("id", classroomIds);

      if (ownerError)
        throw createError({
          statusCode: 500,
          message: `Failed to verify classroom ownership: ${ownerError.message}`,
        });

      const ownedIds = (ownedClassrooms ?? []).map((c: any) => c.id);
      const unauthorized = classroomIds.filter(
        (cid) => !ownedIds.includes(cid),
      );

      if (unauthorized.length > 0)
        throw createError({
          statusCode: 403,
          message: "Forbidden: You do not own all specified classrooms",
        });
    }

    const { error: removeError } = await client
      .from("classroom_students")
      .delete()
      .eq("student_id", id)
      .in("classroom_id", classroomIds);

    if (removeError)
      throw createError({
        statusCode: 500,
        message: `Failed to remove student from classroom(s): ${removeError.message}`,
      });

    return { success: true, action: "unenrolled" };
  }

  // --- FULL DELETE: admin only ---
  if (!isAdmin)
    throw createError({
      statusCode: 403,
      message: "Forbidden: Only admins can delete students",
    });

  const { error: deleteError } = await client.auth.admin.deleteUser(id);

  if (deleteError)
    throw createError({
      statusCode: 500,
      message: `Failed to delete student: ${deleteError.message}`,
    });

  return { success: true, action: "deleted" };
});
