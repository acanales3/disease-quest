import { serverSupabaseUser, serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);

  // @ts-ignore - supabase user can be { id } or { sub }
  const requesterId = user?.id || user?.sub;

  if (!requesterId) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  const studentId = getRouterParam(event, "id");
  const { classroomId } = getQuery(event) as { classroomId?: string };

  if (!studentId) {
    throw createError({
      statusCode: 400,
      message: "Student ID is required",
    });
  }

  if (!classroomId) {
    throw createError({
      statusCode: 400,
      message: "classroomId query param is required",
    });
  }

  // Fetch requester profile for role check
  const { data: userProfile, error: profileError } = (await client
    .from("users")
    .select("role")
    .eq("id", requesterId)
    .single()) as { data: { role: string } | null; error: any };

  if (profileError || !userProfile) {
    throw createError({
      statusCode: 403,
      message: "Forbidden: User profile not found",
    });
  }

  const role = userProfile.role?.toUpperCase();
  const isAdmin = role === "ADMIN";

  // If not admin, must be the instructor of the classroom
  if (!isAdmin) {
    const { data: classroom, error: classroomError } = await client
      .from("classrooms")
      .select("id, instructor_id")
      .eq("id", classroomId)
      .single();

    if (classroomError || !classroom) {
      throw createError({
        statusCode: 404,
        message: "Classroom not found",
      });
    }

    const isInstructorOfClass = classroom.instructor_id === requesterId;
    if (!isInstructorOfClass) {
      throw createError({
        statusCode: 403,
        message: "Forbidden: You are not authorized to modify this classroom",
      });
    }
  }

  // Remove the relationship, not the student record
  const { error: removeError } = await client
    .from("classroom_students")
    .delete()
    .eq("classroom_id", classroomId)
    .eq("student_id", studentId);

  if (removeError) {
    throw createError({
      statusCode: 500,
      message: `Error removing student from classroom: ${removeError.message}`,
    });
  }

  return {
    success: true,
    message: `Student ${studentId} was removed from classroom ${classroomId}.`,
  };
});
