import {
  serverSupabaseUser,
  serverSupabaseServiceRole,
} from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
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

  const { data: userProfile, error: profileError } = (await client
    .from("users")
    .select("role")
    .eq("id", userId)
    .single()) as { data: { role: string } | null; error: any };

  if (profileError || !userProfile) {
    console.error("Profile fetch error:", profileError);
    console.error("Failed userId:", userId);
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden: User profile not found",
    });
  }

  const role = userProfile.role?.toUpperCase();

  let query;

  if (role === "INSTRUCTOR") {
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
          school
        ),
        classroom_students!inner (
          classroom_id,
          classrooms!inner (
            instructor_id
          )
        )
      `,
      )
      .eq("classroom_students.classrooms.instructor_id", userId)
      .order("user_id", { ascending: true });
  } else if (role === "ADMIN") {
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
          school
        ),
        classroom_students (
          classroom_id
        )
      `,
      )
      .order("user_id", { ascending: true });
  } else {
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
    const name =
      [row?.users?.first_name, row?.users?.last_name]
        .filter(Boolean)
        .join(" ") ||
      row?.nickname ||
      "Unknown";

    return {
      id: idx + 1,
      userId: row.user_id,
      name,
      nickname: row?.nickname ?? "",
      email: row?.users?.email ?? "",
      school: row?.users?.school ?? "",
      msyear: row?.msyear ?? 0,
      classroom:
        Number(
          Array.isArray(row?.classroom_students) &&
            row.classroom_students.length > 0
            ? (row.classroom_students[0]?.classroom_id ?? 0)
            : 0,
        ) || 0,
      classrooms: Array.isArray(row?.classroom_students)
        ? row.classroom_students
            .map((cs: any) => cs.classroom_id)
            .filter(Boolean)
        : [],
      status: row?.status ?? "registered",
    };
  });

  return students;
});
