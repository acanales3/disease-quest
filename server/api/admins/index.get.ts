import { defineEventHandler, createError } from "h3";
import {
  serverSupabaseUser,
  serverSupabaseServiceRole,
} from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = serverSupabaseServiceRole(event);

  if (!user)
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

  // @ts-ignore
  const userId = user.id || user.sub;
  if (!userId)
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: User ID missing",
    });

  const { data: profile, error: profileError } = (await client
    .from("users")
    .select("role")
    .eq("id", userId)
    .single()) as { data: { role: string | null } | null; error: any };

  if (profileError) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch user profile: " + profileError.message,
    });
  }

  const role = (profile?.role ?? "").toString().toUpperCase();
  let isAdmin = role === "ADMIN";

  if (!isAdmin) {
    const { data: adminRow, error: adminCheckError } = await client
      .from("admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (adminCheckError) {
      throw createError({
        statusCode: 500,
        statusMessage:
          "Failed to check admin access: " + adminCheckError.message,
      });
    }
    isAdmin = !!adminRow;
  }

  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden: Not authorized to view administrators",
    });
  }

  const { data, error } = await client
    .from("admins")
    .select(
      `
      user_id,
      users:users!inner (
        id,
        first_name,
        last_name,
        email,
        school
      )
    `,
    )
    .order("user_id", { ascending: true });

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch admins: " + error.message,
    });
  }

  // fetch classrooms where the admin is the instructor
  const adminUserIds = (data ?? []).map((row: any) => row.user_id);

  const { data: classroomsData, error: classroomsError } = await client
    .from("classrooms")
    .select("id, name, instructor_id")
    .in("instructor_id", adminUserIds) as { data: { id: number; name: string; instructor_id: string }[] | null; error: any };

  console.log("[admins] classroomsData:", classroomsData);
  console.log("[admins] classroomsError:", classroomsError);

  if (classroomsError) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch classrooms: " + classroomsError.message,
    });
  }

  // group classrooms by instructor_id
  const classroomsByInstructor = new Map<string, { id: number; name: string }[]>();
  for (const c of classroomsData ?? []) {
    const list = classroomsByInstructor.get(c.instructor_id) ?? [];
    list.push({ id: c.id, name: c.name });
    classroomsByInstructor.set(c.instructor_id, list);
  }

  const admins = (data ?? []).map((row: any, idx: number) => {
    const u = row?.users;
    const name =
      [u?.first_name, u?.last_name].filter(Boolean).join(" ") || "Unknown";
    return {
      id: idx + 1,
      userId: row.user_id,
      name,
      email: u?.email ?? "",
      school: u?.school ?? "",
      classrooms: classroomsByInstructor.get(row.user_id) ?? [],
    };
  });

  return admins;
});
