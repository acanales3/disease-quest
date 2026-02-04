import { serverSupabaseUser, serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);

  const userId = user?.id || (user as any)?.sub;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  // role check
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
  if (role !== "ADMIN") {
    throw createError({ statusCode: 403, message: "Forbidden" });
  }

  const { data, error } = await client
    .from("instructors")
    .select(
      `
      user_id,
      status,
      users:users!inner (
        first_name,
        last_name,
        name,
        email,
        school,
        role
      ),
      classrooms:classrooms (
        id
      )
    `
    )
    .eq("users.role", "INSTRUCTOR")
    .order("user_id", { ascending: true });

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch instructors",
      data: { details: error?.message ?? error },
    });
  }

  const instructors = (data ?? []).map((row: any, idx: number) => {
    const first = row?.users?.first_name ?? "";
    const last = row?.users?.last_name ?? "";
    const fullName = `${first} ${last}`.trim();
    const name = fullName || row?.users?.name || "Unknown";
    const classroomCount = Array.isArray(row?.classrooms)
      ? row.classrooms.length
      : 0;

    const rawStatus = (row?.status ?? "active") as string;
    const status =
      rawStatus.toLowerCase() === "deactivated" ? "deactivated" : "active";

    return {
      // Numeric id for datatable display
      id: idx + 1,
      // UUID for edits/deletes
      userId: row.user_id,
      first_name: first,
      last_name: last,
      name,
      email: row?.users?.email ?? "",
      school: row?.users?.school ?? "",
      // This table column currently expects a number; use classroom count.
      classroom: classroomCount,
      status,
    };
  });

  return instructors;
});

