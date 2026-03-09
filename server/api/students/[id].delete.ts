import {
  serverSupabaseUser,
  serverSupabaseServiceRole,
} from "#supabase/server";
import { getQuery, getRouterParam } from "h3";
import { logNotification } from "../../utils/notifications";
import { deleteInvitationsForInvitee } from "../../utils/invitations";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = serverSupabaseServiceRole(event);

  // @ts-ignore
  const userId = user?.id || user?.sub;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "Student ID is required" });
  }

  const { data: userProfile, error: profileError } = await client
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError || !userProfile) {
    throw createError({
      statusCode: 403,
      message: "Forbidden: User profile not found",
    });
  }

  const role = (userProfile as any).role?.toUpperCase();
  const isAdmin = role === "ADMIN";
  const isInstructor = role === "INSTRUCTOR";

  if (!isAdmin && !isInstructor) {
    throw createError({ statusCode: 403, message: "Forbidden: access denied" });
  }

  const query = getQuery(event);
  const classroomIdsParam =
    typeof query.classroomIds === "string" ? query.classroomIds : "";

  // --- UNENROLL: keep account, remove from selected classroom(s) ---
  if (classroomIdsParam) {
    const classroomIds = classroomIdsParam
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);

    if (classroomIds.length === 0) {
      throw createError({
        statusCode: 400,
        message: "No valid classroom IDs provided",
      });
    }

    if (isInstructor) {
      const { data: ownedClassrooms, error: ownerError } = await client
        .from("classrooms")
        .select("id")
        .eq("instructor_id", userId)
        .in("id", classroomIds);

      if (ownerError) {
        throw createError({
          statusCode: 500,
          message: `Failed to verify classroom ownership: ${ownerError.message}`,
        });
      }

      const ownedIds = (ownedClassrooms ?? []).map((c: any) => c.id);
      const unauthorized = classroomIds.filter((cid) => !ownedIds.includes(cid));
      if (unauthorized.length > 0) {
        throw createError({
          statusCode: 403,
          message: "Forbidden: You do not own all specified classrooms",
        });
      }
    }

    const { error: removeError } = await client
      .from("classroom_students")
      .delete()
      .eq("student_id", id)
      .in("classroom_id", classroomIds);

    if (removeError) {
      throw createError({
        statusCode: 500,
        message: `Failed to remove student from classroom(s): ${removeError.message}`,
      });
    }

    const classroomActionMessage = ` Removed from classroom(s): ${classroomIds.join(", ")}.`;
    const notifErr = await logNotification(client, {
      recipientUserId: userId,
      actorUserId: userId,
      type: isAdmin
        ? "admin.student.classroom_removed"
        : "instructor.student.classroom_removed",
      message: `${isAdmin ? "Admin" : "Instructor"} processed student action for: ${id}.${classroomActionMessage}`,
    });
    if (notifErr) {
      console.warn("Student unenroll notification log failed:", notifErr.message);
    }

    return { success: true, action: "unenrolled", classroomIds };
  }

  // --- FULL DELETE: admin only ---
  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      message: "Forbidden: Only admins can delete students",
    });
  }

  const { data: targetUser, error: targetUserError } = await client
    .from("users")
    .select("email")
    .eq("id", id)
    .maybeSingle();

  if (targetUserError) {
    throw createError({
      statusCode: 500,
      message: `Failed to fetch student email: ${targetUserError.message}`,
    });
  }

  const invitationCleanupError = await deleteInvitationsForInvitee(client, {
    email: (targetUser as any)?.email ?? null,
    role: "STUDENT",
  });

  if (invitationCleanupError) {
    throw createError({
      statusCode: 500,
      message: `Failed to remove student invitations: ${invitationCleanupError.message}`,
    });
  }

  const { error: deleteError } = await client.auth.admin.deleteUser(id);

  if (deleteError) {
    throw createError({
      statusCode: 500,
      message: `Failed to delete student: ${deleteError.message}`,
    });
  }

  const notifErr = await logNotification(client, {
    recipientUserId: userId,
    actorUserId: userId,
    type: "admin.student.deleted",
    message: `Admin permanently deleted student: ${id}.`,
  });
  if (notifErr) {
    console.warn("Student delete notification log failed:", notifErr.message);
  }

  return { success: true, action: "deleted" };
});
