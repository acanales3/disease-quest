import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, "id");

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Student user_id is required",
    });
  }

  const supabase = (await serverSupabaseClient(event)) as any;

  // Confirm student exists (students.user_id is uuid FK - users.id)
  const { data: studentRow, error: studentFetchError } = await supabase
    .from("students")
    .select("user_id")
    .eq("user_id", userId)
    .single();

  if (studentFetchError || !studentRow) {
    throw createError({
      statusCode: 404,
      statusMessage: "Student not found",
    });
  }

  // Delete dependents first (UUID references from the schema so far)
  const dependentDeletes: Array<Promise<{ error?: any }>> = [
    supabase.from("classroom_students").delete().eq("student_id", userId),
    supabase.from("student_cases").delete().eq("student_id", userId),
    supabase.from("evaluations").delete().eq("student_id", userId),
    supabase.from("leaderboard_entries").delete().eq("student_id", userId),
  ];

  const dependentResults = await Promise.all(dependentDeletes);
  const dependentError = dependentResults.find((r) => r?.error)?.error;
  if (dependentError) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete student related records",
      data: { details: dependentError?.message ?? dependentError },
    });
  }

  // Delete from students table
  const { error: deleteStudentError } = await supabase
    .from("students")
    .delete()
    .eq("user_id", userId);

  if (deleteStudentError) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete student",
      data: { details: deleteStudentError?.message ?? deleteStudentError },
    });
  }

  // NOTE: I intentionally did NOT delete from "users" or "auth.users" here.
  // Deleting "auth.users" requires admin privileges and might break other foreign keys

  return {
    success: true,
    deletedUserId: userId,
  };
});

