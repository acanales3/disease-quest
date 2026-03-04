import {
  serverSupabaseUser,
  serverSupabaseClient,
  serverSupabaseServiceRole,
} from "#supabase/server";
import { randomBytes } from "node:crypto";
import { Database } from "@/assets/types/supabase";
import { logNotification } from "../../utils/notifications";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient<Database>(event);
  const serviceClient = await serverSupabaseServiceRole(event);

  // @ts-ignore
  const userId = user?.id || user?.sub;

  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  // ── Role check ────────────────────────────────────────────────────
  const { data: userProfile, error: profileError } = await client
    .from("users")
    .select("role, school")
    .eq("id", userId)
    .single();

  if (profileError || !userProfile) {
    throw createError({
      statusCode: 403,
      message: "Forbidden: User profile not found",
    });
  }

  const role = (userProfile.role as string)?.toUpperCase();

  if (role !== "INSTRUCTOR" && role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      message: "Forbidden: Only instructors and admins can create classrooms.",
    });
  }

  // ── Parse & validate body ─────────────────────────────────────────
  const body = await readBody(event);
  const { name, code, section, term, startDate, endDate, instructorId } =
    body || {};

  // ── Resolve instructor UUID ───────────────────────────────────────
  let resolvedInstructorId: string = userId;

  if (role === "ADMIN") {
    if (!instructorId || typeof instructorId !== "string") {
      throw createError({
        statusCode: 400,
        message: "Validation failed.",
        data: { errors: { instructorId: "Instructor is required." } },
      });
    }

    const { data: targetInstructor } = await client
      .from("instructors")
      .select("user_id")
      .eq("user_id", instructorId)
      .maybeSingle();

    if (!targetInstructor) {
      // Check if the selected user is an admin and auto-provision as instructor
      const { data: adminRow } = await serviceClient
        .from("admins")
        .select("user_id")
        .eq("user_id", instructorId)
        .maybeSingle();

      if (!adminRow) {
        throw createError({
          statusCode: 400,
          message: "Validation failed.",
          data: { errors: { instructorId: "Selected instructor not found." } },
        });
      }

      const { error: provisionError } = await serviceClient
        .from("instructors")
        .insert({ user_id: instructorId, status: "active" } as any);

      if (provisionError) {
        throw createError({
          statusCode: 500,
          message: "Failed to provision admin as instructor: " + provisionError.message,
        });
      }
    }

    resolvedInstructorId = instructorId;
  } else {
    const { data: instructor, error: instructorError } = await client
      .from("instructors")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    if (instructorError || !instructor) {
      throw createError({
        statusCode: 400,
        message: "No instructor record found for your account.",
      });
    }
  }

  // ── Field validation ──────────────────────────────────────────────
  const errors: Record<string, string> = {};
  if (!name || typeof name !== "string" || name.trim().length === 0)
    errors.name = "Course Title is required.";
  if (!code || typeof code !== "string" || code.trim().length === 0)
    errors.code = "Course Code is required.";
  if (!section || typeof section !== "string" || section.trim().length === 0)
    errors.section = "Section is required.";
  if (!term || typeof term !== "string" || term.trim().length === 0)
    errors.term = "Term is required.";
  if (!startDate) errors.startDate = "Start Date is required.";
  if (!endDate) errors.endDate = "End Date is required.";
  if (startDate && endDate && new Date(startDate) > new Date(endDate))
    errors.endDate = "End Date must be on or after Start Date.";

  if (Object.keys(errors).length > 0) {
    throw createError({
      statusCode: 400,
      message: "Validation failed.",
      data: { errors },
    });
  }

  // ── Generate invite code ──────────────────────────────────────────
  const inviteCode = randomBytes(4).toString("hex").toUpperCase();

  // ── Insert classroom ──────────────────────────────────────────────
  const { data: classroom, error: insertError } = await client
    .from("classrooms")
    .insert({
      name: name.trim(),
      code: code.trim(),
      section: section.trim(),
      start_date: startDate,
      end_date: endDate,
      status: "active" as const,
      instructor_id: resolvedInstructorId,
      school: (userProfile.school as string) || "",
      invitation_code: inviteCode,
    })
    .select(
      "id, name, code, section, start_date, end_date, status, school, invitation_code",
    )
    .single();

  if (insertError || !classroom) {
    throw createError({
      statusCode: 500,
      message: insertError?.message || "Failed to create classroom.",
    });
  }

  const notifMessage =
    role === "ADMIN"
      ? `Admin created classroom ${classroom.name} (${classroom.code}-${classroom.section}) for instructor ${resolvedInstructorId}.`
      : `Instructor created classroom ${classroom.name} (${classroom.code}-${classroom.section}).`;
  const notifErr = await logNotification(serviceClient, {
    recipientUserId: userId,
    actorUserId: userId,
    type:
      role === "ADMIN"
        ? "admin.classroom.created"
        : "instructor.classroom.created",
    message: notifMessage,
  });
  if (notifErr) {
    console.warn("Classroom create notification log failed:", notifErr.message);
  }

  return {
    id: classroom.id,
    name: classroom.name,
    code: classroom.code,
    section: classroom.section,
    startDate: classroom.start_date,
    endDate: classroom.end_date,
    status: classroom.status,
    school: classroom.school,
    term: term?.trim() || "",
    inviteCode: classroom.invitation_code,
    instructorId: resolvedInstructorId,
  };
});
