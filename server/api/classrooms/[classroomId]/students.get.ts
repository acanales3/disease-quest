import {
  serverSupabaseUser,
  serverSupabaseClient,
  serverSupabaseServiceRole,
} from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = serverSupabaseServiceRole(event);

  // @ts-ignore
  const userId = user.id || user.sub;

  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const classroomId = getRouterParam(event, "classroomId");

  if (!classroomId) {
    throw createError({ statusCode: 400, message: "Classroom ID is required" });
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

  const { data: classroom, error: classroomError } = (await client
    .from("classrooms")
    .select("id, instructor_id")
    .eq("id", classroomId)
    .single()) as {
    data: { id: any; instructor_id: string } | null;
    error: any;
  };

  if (classroomError || !classroom) {
    throw createError({ statusCode: 404, message: "Classroom not found" });
  }

  const isInstructorOfClass = classroom.instructor_id === userId;
  const isAdmin = role === "ADMIN";

  if (!isAdmin && !isInstructorOfClass) {
    throw createError({
      statusCode: 403,
      message: "Forbidden: You are not authorized to view this classroom",
    });
  }

  // Removed .eq("users.role", "STUDENT") — unreliable on joined columns
  const { data: students, error: studentsError } = await client
    .from("students")
    .select(
      `
            user_id,
            nickname,
            msyear,
            status,
            users:users!inner (
                first_name,
                last_name,
                email,
                school
            ),
            classroom_students!inner (
                classroom_id
            )
        `,
    )
    .eq("classroom_students.classroom_id", classroomId)
    .order("user_id", { ascending: true });

  if (studentsError) {
    throw createError({ statusCode: 500, message: studentsError.message });
  }

  return (students ?? []).map((row: any) => {
    const u = row.users || {};
    const name =
      [u.first_name, u.last_name].filter(Boolean).join(" ") ||
      row.nickname ||
      "Unknown";
    return {
      id: row.user_id,
      name,
      email: u.email ?? "",
      school: u.school ?? "",
      msyear: row.msyear,
      status: row.status,
    };
  });
});
