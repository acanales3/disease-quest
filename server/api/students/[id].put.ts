import { serverSupabaseUser, serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);

  // @ts-ignore
  const userId = user.id || user.sub;

  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const id = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!id) {
    throw createError({ statusCode: 400, message: "Student ID is required" });
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

  const role = userProfile.role?.toUpperCase();
  const isAdmin = role === "ADMIN";

  if (!isAdmin) {
    throw createError({ statusCode: 403, message: "Forbidden: access denied" });
  }

  // Update users table — no name column anymore
  const { error: userUpdateError } = await client
    .from("users")
    .update({
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      school: body.school,
    } as any)
    .eq("id", id);

  if (userUpdateError) {
    throw createError({
      statusCode: 500,
      message: `Error updating user: ${userUpdateError.message}`,
    });
  }

  // Update students table
  const { error: studentUpdateError } = await client
    .from("students")
    .update({
      nickname: body.nickname,
      msyear: body.msyear,
      status: body.status,
    } as any)
    .eq("user_id", id);

  if (studentUpdateError) {
    throw createError({
      statusCode: 500,
      message: `Error updating student details: ${studentUpdateError.message}`,
    });
  }

  // Update classroom if provided
  if (typeof body.classroom !== "undefined") {
    const classroomId = Number(body.classroom);

    const { error: deleteError } = await client
      .from("classroom_students")
      .delete()
      .eq("student_id", id);

    if (deleteError) {
      throw createError({
        statusCode: 500,
        message: `Error removing student from previous classroom: ${deleteError.message}`,
      });
    }

    if (classroomId > 0) {
      const { error: insertError } = await client
        .from("classroom_students")
        .insert({ classroom_id: classroomId, student_id: id } as any);

      if (insertError) {
        throw createError({
          statusCode: 500,
          message: `Error assigning student to classroom ${classroomId}: ${insertError.message}`,
        });
      }
    }
  }

  return { success: true };
});
