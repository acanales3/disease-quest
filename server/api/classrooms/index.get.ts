import { serverSupabaseUser, serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);

  // @ts-ignore
  const userId = user.id || user.sub;

  if (!userId) throw createError({ statusCode: 401, message: "Unauthorized" });

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

  const selectQuery = `
    *,
    instructor:instructors (
      user:users (
        first_name,
        last_name
      )
    )
  `;

  const mapClassroom = (c: any) => {
    const u = c.instructor?.user;
    const instructor = u
      ? [u.first_name, u.last_name].filter(Boolean).join(" ") || "Unknown"
      : "Unknown";
    return {
      id: c.id,
      name: c.name,
      code: c.code,
      instructor,
      school: c.school,
      section: c.section,
      startDate: c.start_date,
      endDate: c.end_date,
      status: c.status,
      invitationCode: c.invitation_code,
    };
  };

  if (role === "ADMIN") {
    const { data: classrooms, error } = await client
      .from("classrooms")
      .select(selectQuery)
      .order("id", { ascending: true });
    if (error) throw createError({ statusCode: 500, message: error.message });
    return classrooms.map(mapClassroom);
  }

  if (role === "INSTRUCTOR") {
    const { data: classrooms, error } = await client
      .from("classrooms")
      .select(selectQuery)
      .eq("instructor_id", userId)
      .order("id", { ascending: true });
    if (error) throw createError({ statusCode: 500, message: error.message });
    return classrooms.map(mapClassroom);
  }

  if (role === "STUDENT") {
    const { data: enrollments, error } = await client
      .from("classroom_students")
      .select(`classrooms ( ${selectQuery} )`)
      .eq("student_id", userId);
    if (error) throw createError({ statusCode: 500, message: error.message });
    return (enrollments as any[])
      .map((e) => e.classrooms)
      .filter(Boolean)
      .map(mapClassroom)
      .sort((a: any, b: any) => a.id - b.id);
  }

  return [];
});
