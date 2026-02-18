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
  const hasClassroomIds = Object.prototype.hasOwnProperty.call(query, "classroomIds");
  const hasClassroomId = Object.prototype.hasOwnProperty.call(query, "classroomId");
  const isUnenroll = hasClassroomIds || hasClassroomId;

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

  // Mode 1: remove enrollment from classroom(s).
  if (isUnenroll) {
    // Parse classroom IDs — supports both ?classroomIds=1,2,3 and legacy ?classroomId=1
    let parsedClassroomIds: number[] = [];

    if (hasClassroomIds) {
      const raw = query.classroomIds;
      if (typeof raw !== "string" || raw.trim() === "") {
        throw createError({ statusCode: 400, message: "Invalid classroomIds query param" });
      }
      parsedClassroomIds = raw.split(",").map((s) => Number(s.trim()));
    } else if (hasClassroomId) {
      const raw = query.classroomId;
      if (typeof raw !== "string" || raw.trim() === "") {
        throw createError({ statusCode: 400, message: "Invalid classroomId query param" });
      }
      parsedClassroomIds = [Number(raw.trim())];
    }

    // Validate all IDs are positive integers
    if (parsedClassroomIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      throw createError({ statusCode: 400, message: "All classroom IDs must be positive integers" });
    }
    if (parsedClassroomIds.length === 0) {
      throw createError({ statusCode: 400, message: "At least one classroom ID is required" });
    }

    // Authorization: for each classroom, check that the requester has permission
    const { data: classroomRows, error: classroomError } = await adminClient
      .from("classrooms")
      .select("id, instructor_id")
      .in("id", parsedClassroomIds);

    if (classroomError) {
      throw createError({ statusCode: 500, message: `Error fetching classrooms: ${classroomError.message}` });
    }

    const foundIds = new Set((classroomRows ?? []).map((c: any) => c.id));
    const missingIds = parsedClassroomIds.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      throw createError({ statusCode: 404, message: `Classroom(s) not found: ${missingIds.join(", ")}` });
    }

    // Permission check per classroom
    if (!isAdmin) {
      for (const classroom of classroomRows!) {
        const isInstructorOfClass = classroom.instructor_id === requesterId;
        if (!isInstructorOfClass) {
          throw createError({
            statusCode: 403,
            message: `Forbidden: You are not authorized to modify classroom ${classroom.id}`,
          });
        }
      }
    }

    // Ensure the target student exists
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
      throw createError({ statusCode: 404, message: "Student not found" });
    }

    // Remove from all specified classrooms
    const { data: removedRows, error: removeError } = await adminClient
      .from("classroom_students")
      .delete()
      .in("classroom_id", parsedClassroomIds)
      .eq("student_id", studentId)
      .select("student_id, classroom_id");

    if (removeError) {
      throw createError({
        statusCode: 500,
        message: `Error removing student from classroom(s): ${removeError.message}`,
      });
    }
    if (!removedRows || removedRows.length === 0) {
      throw createError({
        statusCode: 404,
        message: `Student ${studentId} is not enrolled in the specified classroom(s).`,
      });
    }

    const removedClassroomIds = removedRows.map((r: any) => r.classroom_id);
    return {
      success: true,
      mode: "unenroll",
      message: `Student ${studentId} was removed from classroom(s): ${removedClassroomIds.join(", ")}.`,
      removedClassroomIds,
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
