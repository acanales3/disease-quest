import {
  serverSupabaseUser,
  serverSupabaseServiceRole,
} from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const adminClient = serverSupabaseServiceRole(event);

  // @ts-ignore - supabase user can be { id } or { sub }
  const requesterId = user?.id || user?.sub;

  if (!requesterId) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  const studentId = getRouterParam(event, "id");
  const query = getQuery(event) as Record<string, unknown>;
  const hasClassroomId = Object.prototype.hasOwnProperty.call(query, "classroomId");
  const classroomIdRaw = query.classroomId;

  if (!studentId) {
    throw createError({
      statusCode: 400,
      message: "Student ID is required",
    });
  }

  // Fetch requester profile for role check
  const { data: userProfile, error: profileError } = (await adminClient
    .from("users")
    .select("role")
    .eq("id", requesterId)
    .single()) as { data: { role: string } | null; error: any };

  if (profileError || !userProfile) {
    throw createError({
      statusCode: 403,
      message: "Forbidden: User profile not found",
    });
  }

  const role = userProfile.role?.toUpperCase();
  const isAdmin = role === "ADMIN";

  // Mode 1: remove enrollment from a classroom.
  if (hasClassroomId) {
    if (typeof classroomIdRaw !== "string" || classroomIdRaw.trim() === "") {
      throw createError({
        statusCode: 400,
        message: "Invalid classroomId query param",
      });
    }

    const parsedClassroomId = Number(classroomIdRaw);
    if (!Number.isInteger(parsedClassroomId) || parsedClassroomId <= 0) {
      throw createError({
        statusCode: 400,
        message: "Invalid classroomId query param",
      });
    }

    // If not admin, must be the instructor of the classroom
    const { data: classroom, error: classroomError } = await adminClient
      .from("classrooms")
      .select("id, instructor_id")
      .eq("id", parsedClassroomId)
      .single();

    if (classroomError || !classroom) {
      throw createError({
        statusCode: 404,
        message: "Classroom not found",
      });
    }

    const isInstructorOfClass = classroom.instructor_id === requesterId;
    if (!isAdmin && !isInstructorOfClass) {
      throw createError({
        statusCode: 403,
        message: "Forbidden: You are not authorized to modify this classroom",
      });
    }

    // Ensure the target student exists.
    const { data: targetStudent, error: targetStudentError } = await adminClient
      .from("students")
      .select("user_id")
      .eq("user_id", studentId)
      .maybeSingle();

    if (targetStudentError) {
      throw createError({
        statusCode: 500,
        message: `Error validating student: ${targetStudentError.message}`,
      });
    }
    if (!targetStudent) {
      throw createError({
        statusCode: 404,
        message: "Student not found",
      });
    }

    const { data: removedRows, error: removeError } = await adminClient
      .from("classroom_students")
      .delete()
      .eq("classroom_id", parsedClassroomId)
      .eq("student_id", studentId)
      .select("student_id, classroom_id");

    if (removeError) {
      throw createError({
        statusCode: 500,
        message: `Error removing student from classroom: ${removeError.message}`,
      });
    }
    if (!removedRows || removedRows.length === 0) {
      throw createError({
        statusCode: 404,
        message: `Student ${studentId} is not enrolled in classroom ${classroomIdRaw}.`,
      });
    }

    return {
      success: true,
      mode: "unenroll",
      message: `Student ${studentId} was removed from classroom ${classroomIdRaw}.`,
    };
  }

  // Mode 2: permanent student deletion (admin only).
  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      message:
        "Forbidden: Only admins can permanently delete student accounts",
    });
  }

  const { data: targetStudent, error: targetStudentError } = await adminClient
    .from("students")
    .select(
      `
      user_id,
      users!inner (
        first_name,
        last_name,
        email,
        role
      )
    `
    )
    .eq("user_id", studentId)
    .eq("users.role", "STUDENT")
    .maybeSingle();

  if (targetStudentError) {
    throw createError({
      statusCode: 500,
      message: `Error loading student: ${targetStudentError.message}`,
    });
  }
  if (!targetStudent) {
    throw createError({
      statusCode: 404,
      message: "Student not found",
    });
  }

  const userInfo = targetStudent.users as
    | { first_name?: string | null; last_name?: string | null; email?: string | null }
    | undefined;
  const displayName =
    [userInfo?.first_name, userInfo?.last_name].filter(Boolean).join(" ") ||
    userInfo?.email ||
    studentId;

  const [
    { count: enrollmentsCount, error: enrollmentsCountErr },
    { count: evaluationsCount, error: evaluationsCountErr },
    { count: leaderboardEntriesCount, error: leaderboardEntriesCountErr },
    { count: studentCasesCount, error: studentCasesCountErr },
  ] = await Promise.all([
    adminClient
      .from("classroom_students")
      .select("*", { head: true, count: "exact" })
      .eq("student_id", studentId),
    adminClient
      .from("evaluations")
      .select("*", { head: true, count: "exact" })
      .eq("student_id", studentId),
    adminClient
      .from("leaderboard_entries")
      .select("*", { head: true, count: "exact" })
      .eq("student_id", studentId),
    adminClient
      .from("student_cases")
      .select("*", { head: true, count: "exact" })
      .eq("student_id", studentId),
  ]);

  if (
    enrollmentsCountErr ||
    evaluationsCountErr ||
    leaderboardEntriesCountErr ||
    studentCasesCountErr
  ) {
    throw createError({
      statusCode: 500,
      message:
        enrollmentsCountErr?.message ||
        evaluationsCountErr?.message ||
        leaderboardEntriesCountErr?.message ||
        studentCasesCountErr?.message ||
        "Failed to inspect student dependencies",
    });
  }

  // Delete from app users table first; DB FKs/cascades handle related student rows atomically.
  const { data: deletedUsers, error: deleteUserError } = await adminClient
    .from("users")
    .delete()
    .eq("id", studentId)
    .select("id");

  if (deleteUserError) {
    throw createError({
      statusCode: 500,
      message: `Failed deleting student user: ${deleteUserError.message}`,
    });
  }
  if (!deletedUsers || deletedUsers.length === 0) {
    throw createError({
      statusCode: 500,
      message: "Delete users affected 0 rows. Student was not deleted.",
    });
  }

  // Delete from Supabase Auth as part of permanent account deletion.
  const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(studentId);
  if (deleteAuthError && !/user not found/i.test(deleteAuthError.message || "")) {
    throw createError({
      statusCode: 500,
      message: `Student app data deleted, but auth user deletion failed: ${deleteAuthError.message}`,
    });
  }

  const message = `Student permanently deleted: ${displayName}.`;
  const { error: notifErr } = await adminClient
    .from("notifications")
    .insert([{ user_id: requesterId, message }]);
  const warning = notifErr
    ? `Student deleted, but notification/audit log failed: ${notifErr.message}`
    : undefined;

  return {
    ok: true,
    mode: "delete",
    message,
    studentId,
    enrollmentsRemoved: enrollmentsCount ?? 0,
    evaluationsRemoved: evaluationsCount ?? 0,
    leaderboardEntriesRemoved: leaderboardEntriesCount ?? 0,
    studentCasesRemoved: studentCasesCount ?? 0,
    warning,
  };
});
