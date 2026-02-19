import { defineEventHandler, createError } from "h3";
import {
  serverSupabaseUser,
  serverSupabaseServiceRole,
} from "#supabase/server";

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

  const { data: profile, error: profileError } = (await client
    .from("users")
    .select("role")
    .eq("id", userId)
    .single()) as { data: { role: string | null } | null; error: any };

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
        statusMessage:
          "Failed to check admin access: " + adminCheckError.message,
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
        school
      )
    `,
    )
    .order("user_id", { ascending: true });

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch admins: " + error.message,
      data: { details: error.message },
    });
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
    };
  });

  return admins;
});
