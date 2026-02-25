import { serverSupabaseUser, serverSupabaseClient } from "#supabase/server";
import { logNotification } from "../../utils/notifications";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = serverSupabaseServiceRole(event);

  // @ts-ignore
  const userId = user.id || user.sub;
  if (!userId) throw createError({ statusCode: 401, message: "Unauthorized" });

  const id = getRouterParam(event, "id");
  if (!id)
    throw createError({ statusCode: 400, message: "Student ID is required" });

  const { data: userProfile, error: profileError } = await client
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError || !userProfile)
    throw createError({
      statusCode: 403,
      message: "Forbidden: User profile not found",
    });

  const role = (userProfile as any).role?.toUpperCase();
  const isAdmin = role === "ADMIN";
  const isInstructor = role === "INSTRUCTOR";

  if (!isAdmin && !isInstructor)
    throw createError({ statusCode: 403, message: "Forbidden: access denied" });

  let classroomActionMessage = "";

  const { error: userUpdateError } = await (client.from("users") as any)
    .update({
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      school: body.school,
    })
    .eq("id", id);

  if (classroomIdsParam) {
    // --- UNENROLL: remove student from specific classrooms, keep account intact ---
    // Instructors can only unenroll from classrooms they own
    const classroomIds = classroomIdsParam
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    if (classroomIds.length === 0)
      throw createError({
        statusCode: 400,
        message: "No valid classroom IDs provided",
      });

    if (isInstructor) {
      // Verify the instructor owns all the classrooms being unenrolled from
      const { data: ownedClassrooms, error: ownerError } = await client
        .from("classrooms")
        .select("id")
        .eq("instructor_id", userId)
        .in("id", classroomIds);

      if (ownerError)
        throw createError({
          statusCode: 500,
          message: `Failed to verify classroom ownership: ${ownerError.message}`,
        });

      const ownedIds = (ownedClassrooms ?? []).map((c: any) => c.id);
      const unauthorized = classroomIds.filter(
        (cid) => !ownedIds.includes(cid),
      );

      if (unauthorized.length > 0)
        throw createError({
          statusCode: 403,
          message: "Forbidden: You do not own all specified classrooms",
        });
    }

    const { error: removeError } = await client
      .from("classroom_students")
      .delete()
      .eq("student_id", id)
      .in("classroom_id", classroomIds);

    if (removeError)
      throw createError({
        statusCode: 500,
        message: `Failed to remove student from classroom(s): ${removeError.message}`,
      });

    if (classroomId > 0) {
      const { error: insertError } = await (
        client.from("classroom_students") as any
      ).insert({ classroom_id: classroomId, student_id: id });

      if (insertError)
        throw createError({
          statusCode: 500,
          message: `Error assigning student to classroom ${classroomId}: ${insertError.message}`,
        });
    }

    classroomActionMessage =
      classroomId > 0
        ? ` Assigned to classroom ${classroomId}.`
        : " Removed from classroom assignment.";
  }

  const notifErr = await logNotification(client, {
    recipientUserId: userId,
    message: `Admin processed student delete action for: ${id}.${classroomActionMessage}`,
  });
  if (notifErr) {
    console.warn("Student delete notification log failed:", notifErr.message);
  }

  // --- FULL DELETE: admin only ---
  if (!isAdmin)
    throw createError({
      statusCode: 403,
      message: "Forbidden: Only admins can delete students",
    });

  const { error: deleteError } = await client.auth.admin.deleteUser(id);

  if (deleteError)
    throw createError({
      statusCode: 500,
      message: `Failed to delete student: ${deleteError.message}`,
    });

  return { success: true, action: "deleted" };
});
