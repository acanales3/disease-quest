import { serverSupabaseClient } from "#supabase/server";
import { Database } from "@/assets/types/supabase";

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event);

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  // Role check
  const { data: requester } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (requester?.role !== "ADMIN") {
    throw createError({ statusCode: 403, statusMessage: "Admin only" });
  }

  // Fetch instructors + user + classrooms
  const { data, error } = await supabase.from("instructors").select(`
      status,
      user:users (
        id,
        first_name,
        last_name,
        email,
        school
      ),
      classrooms (
        id,
        name
      )
    `);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  // Normalize for table
  return data.map((row: any, idx: number) => ({
    index: idx + 1,
    id: row.user.id,
    name:
      [row.user.first_name, row.user.last_name].filter(Boolean).join(" ") ||
      row.user.email ||
      "",
    email: row.user.email,
    school: row.user.school,
    classrooms: row.classrooms ?? [],
    status: row.status,
  }));
});
