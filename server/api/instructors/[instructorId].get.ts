import { serverSupabaseClient } from "#supabase/server";
import { Database } from "@/assets/types/supabase";

export default defineEventHandler(async (event) => {
  const instructorId = event.context.params?.instructorId;

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
  if (authError || !user)
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

  const { data: requester, error: requesterError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (requesterError || !requester)
    throw createError({ statusCode: 403, statusMessage: "Invalid requester" });
  if (requester.role !== "ADMIN")
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden: Admin access required",
    });

  const { data: instructorData, error: fetchError } = await supabase
    .from("instructors")
    .select(
      `
      user_id,
      status,
      user:users (
        id,
        first_name,
        last_name,
        email,
        role
      )
    `,
    )
    .eq("user_id", instructorId)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116")
      throw createError({
        statusCode: 404,
        statusMessage: "Instructor not found",
      });
    throw createError({
      statusCode: 500,
      statusMessage: `Database error: ${fetchError.message}`,
    });
  }

  if (!instructorData)
    throw createError({
      statusCode: 404,
      statusMessage: "Instructor not found",
    });

  const { data: classrooms, error: classroomError } = await supabase
    .from("classrooms")
    .select("id, name, code, school, section, status")
    .eq("instructor_id", instructorId);

  if (classroomError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch classrooms: ${classroomError.message}`,
    });
  }

  const u = instructorData.user as any;
  const name =
    [u?.first_name, u?.last_name].filter(Boolean).join(" ") || u?.email || "";

  return {
    instructorId: instructorData.user_id,
    name,
    email: u?.email,
    role: u?.role,
    status: instructorData.status,
    assignedClassrooms: classrooms || [],
  };
});
