import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import {
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from "#supabase/server";
import type { TablesUpdate } from "@/assets/types/supabase";

type UserUpdate = TablesUpdate<"users">;

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  // @ts-ignore Supabase user shape can vary by runtime/library version
  const actorUserId: string | undefined = user?.id || user?.sub;

  if (!actorUserId) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const targetId = getRouterParam(event, "id");
  if (!targetId) {
    throw createError({ statusCode: 400, statusMessage: "Missing admin id" });
  }

  const client = serverSupabaseServiceRole(event);

  // Authorize requester as admin.
  const { data: actorProfile, error: actorProfileError } = (await client
    .from("users")
    .select("role")
    .eq("id", actorUserId)
    .single()) as { data: { role: string | null } | null; error: any };

  if (actorProfileError || !actorProfile) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to verify requester",
    });
  }

  let isAdmin = (actorProfile.role ?? "").toUpperCase() === "ADMIN";
  if (!isAdmin) {
    const { data: adminRow, error: adminCheckError } = await client
      .from("admins")
      .select("user_id")
      .eq("user_id", actorUserId)
      .maybeSingle();

    if (adminCheckError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to check admin access: ${adminCheckError.message}`,
      });
    }

    isAdmin = !!adminRow;
  }

  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden: Admin access required",
    });
  }

  const body = await readBody<{
    first_name?: string;
    last_name?: string;
    email?: string;
    school?: string;
  }>(event);

  if (!body || Object.keys(body).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Request body cannot be empty",
    });
  }

  if (body.email !== undefined || body.school !== undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: "Only first_name and last_name are editable for admins",
    });
  }

  // Verify target exists in admins table.
  const { data: targetAdmin, error: targetAdminError } = await client
    .from("admins")
    .select("user_id")
    .eq("user_id", targetId)
    .maybeSingle();

  if (targetAdminError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to verify target admin: ${targetAdminError.message}`,
    });
  }
  if (!targetAdmin) {
    throw createError({ statusCode: 404, statusMessage: "Admin not found" });
  }

  const { data: targetUser, error: targetUserError } = (await client
    .from("users")
    .select("id, first_name, last_name, email, school, name")
    .eq("id", targetId)
    .single()) as { data: any; error: any };

  if (targetUserError || !targetUser) {
    throw createError({
      statusCode: 404,
      statusMessage: "Target user record not found",
    });
  }

  const userUpdate: UserUpdate = {};
  if (body.first_name !== undefined) userUpdate.first_name = body.first_name;
  if (body.last_name !== undefined) userUpdate.last_name = body.last_name;

  if (body.first_name !== undefined || body.last_name !== undefined) {
    const first = body.first_name ?? targetUser.first_name ?? "";
    const last = body.last_name ?? targetUser.last_name ?? "";
    userUpdate.name = `${first} ${last}`.trim();
  }

  if (Object.keys(userUpdate).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "No valid fields to update",
    });
  }

  const { error: updateError } = await client
    .from("users")
    // @ts-ignore Service-role typing mismatch in generated types
    .update(userUpdate as any)
    .eq("id", targetId);

  if (updateError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to update admin: ${updateError.message}`,
    });
  }

  const { data: updatedUser, error: fetchError } = (await client
    .from("users")
    .select("id, first_name, last_name, email, school, name")
    .eq("id", targetId)
    .single()) as { data: any; error: any };

  if (fetchError || !updatedUser) {
    throw createError({
      statusCode: 500,
      statusMessage: "Admin updated but failed to fetch updated record",
    });
  }

  return {
    success: true,
    data: {
      userId: updatedUser.id,
      name:
        `${updatedUser.first_name ?? ""} ${updatedUser.last_name ?? ""}`.trim() ||
        updatedUser.name ||
        "Unknown",
      email: updatedUser.email ?? "",
      school: updatedUser.school ?? "",
    },
  };
});
