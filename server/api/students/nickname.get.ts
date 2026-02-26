import {
  serverSupabaseUser,
  serverSupabaseServiceRole,
} from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  // @ts-ignore
  const userId = user.id || user.sub;
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const client = serverSupabaseServiceRole(event);

  const { data: student, error } = await (client as any)
    .from("students")
    .select("nickname")
    .eq("user_id", userId)
    .single();

  if (error || !student) {
    throw createError({
      statusCode: 404,
      statusMessage: "Student record not found",
    });
  }

  return { nickname: student.nickname };
});
