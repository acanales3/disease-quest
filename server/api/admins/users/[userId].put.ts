import { defineEventHandler, createError, readBody, getRouterParam } from "h3";
import {
  serverSupabaseUser,
  serverSupabaseServiceRole,
} from "#supabase/server";
import type { Database, TablesUpdate } from "@/assets/types/supabase";

type UserUpdate = TablesUpdate<"users">;
type UserRole = Database["public"]["Enums"]["user_role"];
type InstructorStatus = Database["public"]["Enums"]["instructor_status"];
type StudentStatus = Database["public"]["Enums"]["student_status"];

const VALID_ROLES: UserRole[] = ["ADMIN", "INSTRUCTOR", "STUDENT"];
const VALID_INSTRUCTOR_STATUSES: InstructorStatus[] = ["active", "deactivated"];
const VALID_STUDENT_STATUSES: StudentStatus[] = ["registered", "unregistered"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  // @ts-ignore
  const actorUserId: string | undefined = user?.id || user?.sub;
  if (!actorUserId)
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

  const userId = getRouterParam(event, "userId");
  if (!userId)
    throw createError({
      statusCode: 400,
      statusMessage: "User ID is required",
    });

  const client = serverSupabaseServiceRole(event);

  const { data: actorProfile, error: actorError } = (await client
    .from("users")
    .select("role")
    .eq("id", actorUserId)
    .single()) as { data: { role: string | null } | null; error: any };

  if (actorError || !actorProfile)
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to verify requester",
    });

  const actorRole = (actorProfile.role ?? "").toUpperCase();
  let isAdmin = actorRole === "ADMIN";

  if (!isAdmin) {
    const { data: adminRow, error: adminCheckError } = await client
      .from("admins")
      .select("user_id")
      .eq("user_id", actorUserId)
      .maybeSingle();
    if (adminCheckError)
      throw createError({
        statusCode: 500,
        statusMessage:
          "Failed to check admin access: " + adminCheckError.message,
      });
    isAdmin = !!adminRow;
  }

  if (!isAdmin)
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden: Admin access required",
    });

  const body = await readBody<{
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    school?: string;
    role?: UserRole;
    status?: string;
  }>(event);

  if (!body || Object.keys(body).length === 0)
    throw createError({
      statusCode: 400,
      statusMessage: "Request body cannot be empty",
    });

  if (
    body.email !== undefined &&
    (typeof body.email !== "string" || !EMAIL_REGEX.test(body.email))
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid email format",
    });
  }

  if (body.role !== undefined && !VALID_ROLES.includes(body.role)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`,
    });
  }

  const { data: targetUser, error: targetUserError } = (await client
    .from("users")
    .select("id, email, first_name, last_name, role, school, created_at")
    .eq("id", userId)
    .single()) as { data: any; error: any };

  if (targetUserError || !targetUser)
    throw createError({ statusCode: 404, statusMessage: "User not found" });

  if (body.email !== undefined && body.email !== targetUser.email) {
    const { data: emailExists, error: emailCheckError } = await client
      .from("users")
      .select("id")
      .eq("email", body.email)
      .neq("id", userId)
      .maybeSingle();
    if (emailCheckError)
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to check email uniqueness",
      });
    if (emailExists)
      throw createError({
        statusCode: 409,
        statusMessage: "Email is already in use by another account",
      });
  }

  const userUpdate: UserUpdate = {};
  if (body.first_name !== undefined) userUpdate.first_name = body.first_name;
  if (body.last_name !== undefined) userUpdate.last_name = body.last_name;
  if (body.email !== undefined) userUpdate.email = body.email;
  if (body.school !== undefined) userUpdate.school = body.school;
  if (body.role !== undefined) userUpdate.role = body.role;

  if (Object.keys(userUpdate).length > 0) {
    const { error: updateError } = await client
      .from("users")
      // @ts-ignore
      .update(userUpdate as any)
      .eq("id", userId);
    if (updateError)
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to update user: ${updateError.message}`,
      });
  }

  const effectiveRole = (body.role ?? targetUser.role ?? "") as string;

  if (body.status !== undefined) {
    if (effectiveRole === "INSTRUCTOR") {
      if (
        !VALID_INSTRUCTOR_STATUSES.includes(body.status as InstructorStatus)
      ) {
        throw createError({
          statusCode: 400,
          statusMessage: `Invalid status for instructor. Must be one of: ${VALID_INSTRUCTOR_STATUSES.join(", ")}`,
        });
      }
      const { error: instructorError } = await client
        .from("instructors")
        // @ts-ignore
        .update({ status: body.status as InstructorStatus } as any)
        .eq("user_id", userId);
      if (instructorError)
        throw createError({
          statusCode: 500,
          statusMessage: `Failed to update instructor status: ${instructorError.message}`,
        });
    } else if (effectiveRole === "STUDENT") {
      if (!VALID_STUDENT_STATUSES.includes(body.status as StudentStatus)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Invalid status for student. Must be one of: ${VALID_STUDENT_STATUSES.join(", ")}`,
        });
      }
      const { error: studentError } = await client
        .from("students")
        // @ts-ignore
        .update({ status: body.status as StudentStatus } as any)
        .eq("user_id", userId);
      if (studentError)
        throw createError({
          statusCode: 500,
          statusMessage: `Failed to update student status: ${studentError.message}`,
        });
    } else if (effectiveRole === "ADMIN") {
      throw createError({
        statusCode: 400,
        statusMessage: "Admin users do not have a modifiable status field",
      });
    }
  }

  const { data: updatedUser, error: fetchError } = (await client
    .from("users")
    .select("id, email, first_name, last_name, role, school, created_at")
    .eq("id", userId)
    .single()) as { data: any; error: any };

  if (fetchError || !updatedUser)
    throw createError({
      statusCode: 500,
      statusMessage: "User updated but failed to fetch updated record",
    });

  let status: string | null = null;
  const updatedRole = (updatedUser.role ?? "") as string;

  if (updatedRole === "INSTRUCTOR") {
    const { data: instructor } = (await client
      .from("instructors")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle()) as { data: { status: string } | null; error: any };
    status = instructor?.status ?? null;
  } else if (updatedRole === "STUDENT") {
    const { data: student } = (await client
      .from("students")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle()) as { data: { status: string } | null; error: any };
    status = student?.status ?? null;
  }

  return {
    success: true,
    data: {
      id: updatedUser.id,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      name:
        [updatedUser.first_name, updatedUser.last_name]
          .filter(Boolean)
          .join(" ") || "Unknown",
      email: updatedUser.email,
      role: updatedUser.role,
      school: updatedUser.school,
      status,
      created_at: updatedUser.created_at,
    },
  };
});
