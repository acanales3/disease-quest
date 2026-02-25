import { serverSupabaseClient } from "#supabase/server";
import { Database, TablesUpdate } from "@/assets/types/supabase";

type UserUpdate = TablesUpdate<"users">;
type InstructorUpdate = TablesUpdate<"instructors">;

export default defineEventHandler(async (event) => {
  const instructorId = event.context.params?.id;
  if (!instructorId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Instructor ID required",
    });
  }

  const supabase = await serverSupabaseClient<Database>(event);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const { data: requester, error: requesterError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (requesterError || !requester) {
    throw createError({ statusCode: 403, statusMessage: "Invalid requester" });
  }

  const isAdmin = requester.role === "ADMIN";
  const isSelf = user.id === instructorId;

  if (!isAdmin && !isSelf) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden from changing other account data",
    });
  }

  const body = await readBody<{
    first_name?: string;
    last_name?: string;
    email?: string;
    school?: string;
    status?: Database["public"]["Enums"]["instructor_status"];
  }>(event);

  if (body.status && !isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: "Only admins can update instructor status",
    });
  }

  if (body.email && !body.email.includes("@")) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid email address",
    });
  }

  // Update users table — no name column, only first_name/last_name
  const userUpdate: UserUpdate = {};
  if (body.first_name !== undefined) userUpdate.first_name = body.first_name;
  if (body.last_name !== undefined) userUpdate.last_name = body.last_name;
  if (body.email !== undefined) userUpdate.email = body.email;
  if (body.school !== undefined) userUpdate.school = body.school;

  if (Object.keys(userUpdate).length > 0) {
    const { error: userError } = await supabase
      .from("users")
      .update(userUpdate)
      .eq("id", instructorId);

    if (userError) {
      throw createError({ statusCode: 500, statusMessage: userError.message });
    }
  }

  if (body.status !== undefined) {
    const instructorUpdate: InstructorUpdate = { status: body.status };

    const { error: instructorError } = await supabase
      .from("instructors")
      .update(instructorUpdate)
      .eq("user_id", instructorId);

    if (instructorError) {
      throw createError({
        statusCode: 500,
        statusMessage: instructorError.message,
      });
    }
  }

  return { success: true };
});
