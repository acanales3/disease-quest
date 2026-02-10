import { defineEventHandler, createError } from "h3";
import { serverSupabaseUser, serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = serverSupabaseServiceRole(event);

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  // @ts-ignore
  const userId = user.id || user.sub;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: User ID missing",
    });
  }

  // Allow if users.role is ADMIN OR user exists in admins table
  const { data: profile, error: profileError } = await client
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch user profile: " + profileError.message,
      data: { details: profileError.message },
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
        statusMessage: "Failed to check admin access: " + adminCheckError.message,
        data: { details: adminCheckError.message },
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

  // Fetch all admins via admins table + users join
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
        school,
        name
      )
    `
    )
    .order("user_id", { ascending: true });

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch admins: " + error.message,
      data: { details: error.message },
    });
  }

  // ✅ IMPORTANT: id is row number; userId keeps UUID for later
  const admins = (data ?? []).map((row: any, idx: number) => {
    const u = row?.users;
    const first = u?.first_name ?? "";
    const last = u?.last_name ?? "";
    const fullName = `${first} ${last}`.trim();
    const name = fullName || u?.name || "Unknown";

    return {
      id: idx + 1,          // ✅ shows 1,2,3... in table
      userId: row.user_id,  // ✅ keep UUID for edit/delete later
      name,
      email: u?.email ?? "",
      school: u?.school ?? "",
      classroom: 0,
      status: "active" as const,
    };
  });

  return admins;
});
