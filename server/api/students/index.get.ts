import { serverSupabaseClient, serverSupabaseUser, serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  // Use Service Role to bypass RLS for permission checks and admin actions
  const client = serverSupabaseServiceRole(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  // @ts-ignore
  const userId = user.id || user.sub;

  if (!userId) {
    console.error("User object missing ID:", user);
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: User ID missing",
    });
  }

  // Fetch user profile to check role
  const { data: userProfile, error: profileError } = await client
    .from("users")
    .select("role")
    .eq("id", userId)
    .single() as { data: { role: string } | null, error: any };

  if (profileError || !userProfile) {
    console.error("Profile fetch error:", profileError);
    // Log userId for debugging context
    console.error("Failed userId:", userId);
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden: User profile not found",
    });
  }

  const role = userProfile.role?.toUpperCase();

  let query;

  if (role === "INSTRUCTOR") {
    // For instructors, we only want students who are in a classroom taught by this instructor
    query = client
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
          school,
          role
        ),
        classroom_students!inner (
          classroom_id,
          classrooms!inner (
            instructor_id
          )
        )
      `
      )
      .eq("users.role", "STUDENT")
      .eq("classroom_students.classrooms.instructor_id", userId)
      .order("user_id", { ascending: true });
  } else if (role === "ADMIN") {
    // For admins, fetch all students (restore original query shape)
    query = client
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
          school,
          role
        ),
        classroom_students (
          classroom_id
        )
      `
      )
      .eq("users.role", "STUDENT")
      .order("user_id", { ascending: true });
  } else {
    // Forbidden
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden: You are not authorized to view students",
    });
  }

  const { data, error } = await query;

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch students: " + error.message,
      data: { details: error.message },
    });
  }

  const students = (data ?? []).map((row: any, idx: number) => {
    const first = row?.users?.first_name ?? "";
    const last = row?.users?.last_name ?? "";
    const name = `${first} ${last}`.trim() || row?.users?.name || row?.nickname || "Unknown";

    const classroomId =
      Array.isArray(row?.classroom_students) && row.classroom_students.length > 0
        ? row.classroom_students[0]?.classroom_id ?? 0
        : 0;

    return {
      // Keep numeric id for the UI datatable (row number)
      id: idx + 1,
      // Keep UUID for backend operations
      userId: row.user_id,
      name,
      nickname: row?.nickname ?? "",
      email: row?.users?.email ?? "",
      school: row?.users?.school ?? "",
      msyear: row?.msyear ?? 0,
      classroom: Number(classroomId) || 0,
      status: row?.status ?? "registered",
    };
  });

  return students;
});

