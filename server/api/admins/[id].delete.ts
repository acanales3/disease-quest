import { defineEventHandler, createError, getRouterParam } from "h3";
import {
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from "#supabase/server";

export default defineEventHandler(async (event) => {
  // 1) Authenticate actor
  const user = await serverSupabaseUser(event);
  const actorUserId: string | undefined =
    (user as any)?.id || (user as any)?.sub;

  if (!actorUserId) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const targetId = getRouterParam(event, "id");
  if (!targetId) {
    throw createError({ statusCode: 400, statusMessage: "Missing admin id" });
  }

  // Prevent self-delete
  if (actorUserId === targetId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Admins cannot delete themselves",
    });
  }

  // Single service-role client for all ops (bypasses RLS safely)
  const client = serverSupabaseServiceRole(event);

  // 2) Verify actor is an admin
  const { data: actorProfile, error: actorProfileError } = await client
    .from("users")
    .select("role")
    .eq("id", actorUserId)
    .single();

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

  // 3) Ensure target exists as admin
  const { data: targetAdmin, error: targetAdminErr } = await client
    .from("admins")
    .select("user_id")
    .eq("user_id", targetId)
    .maybeSingle();

  if (targetAdminErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to verify target admin: ${targetAdminErr.message}`,
    });
  }
  if (!targetAdmin) {
    throw createError({ statusCode: 404, statusMessage: "Admin not found" });
  }

  // 4) Snapshot user info before deletion
  const { data: targetUser } = await client
    .from("users")
    .select("id, email, first_name, last_name")
    .eq("id", targetId)
    .maybeSingle();

  const displayName =
    [targetUser?.first_name, targetUser?.last_name].filter(Boolean).join(" ") ||
    targetUser?.email ||
    targetId;

  // 5) Delete from Supabase Auth (cascades to public.users → public.admins)
  const { error: deleteAuthError } =
    await client.auth.admin.deleteUser(targetId);

  if (
    deleteAuthError &&
    !/user not found/i.test(deleteAuthError.message || "")
  ) {
    throw createError({
      statusCode: 500,
      statusMessage: `Auth user deletion failed: ${deleteAuthError.message}`,
    });
  }

  // 6) Best-effort audit log — do NOT throw if this fails, deletion already succeeded
  const message = `Admin permanently deleted: ${displayName}.`;

  await client
    .from("notifications")
    .insert([{ user_id: actorUserId, message }])
    .then(({ error }) => {
      if (error) {
        console.warn("Audit log failed (non-fatal):", error.message);
      }
    });

  return {
    ok: true,
    message,
    adminId: targetId,
    deletedUserId: targetId,
  };
});
