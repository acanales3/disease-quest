import { defineEventHandler, createError, getRouterParam } from "h3";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const authedClient = await serverSupabaseClient(event);

  // @ts-ignore (supabase user shape can vary)
  const actorUserId: string | undefined =
    (user as any)?.id || (user as any)?.sub;
  if (!actorUserId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const targetId = getRouterParam(event, "id");
  if (!targetId) {
    throw createError({ statusCode: 400, message: "Missing admin id" });
  }

  // 1) Only admins can delete admins (check actor is admin)
  const { data: actorIsAdminRow, error: actorIsAdminErr } = await authedClient
    .from("admins")
    .select("user_id")
    .eq("user_id", actorUserId)
    .maybeSingle();

  if (actorIsAdminErr) {
    throw createError({ statusCode: 500, message: actorIsAdminErr.message });
  }
  if (!actorIsAdminRow) {
    throw createError({ statusCode: 403, message: "Forbidden: Admin only" });
  }

  // Optional: prevent self-delete
  if (actorUserId === targetId) {
    throw createError({
      statusCode: 400,
      message: "Admins cannot delete themselves",
    });
  }

  // 2) Service role client for destructive ops (bypass RLS)
  const config = useRuntimeConfig();

  const url =
    (config as any)?.supabase?.url || (config as any)?.public?.supabase?.url;

  const serviceKey =
    (config as any)?.supabase?.serviceRoleKey ||
    (config as any)?.supabase?.serviceKey ||
    (config as any)?.supabase?.key;

  if (!url || !serviceKey) {
    throw createError({
      statusCode: 500,
      message:
        "Missing Supabase service role config. Expected config.supabase.url and config.supabase.serviceRoleKey (or serviceKey).",
    });
  }

  const adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  // 3) Ensure target exists as admin
  const { data: targetAdmin, error: targetAdminErr } = await adminClient
    .from("admins")
    .select("user_id")
    .eq("user_id", targetId)
    .maybeSingle();

  if (targetAdminErr) {
    throw createError({ statusCode: 500, message: targetAdminErr.message });
  }
  if (!targetAdmin) {
    throw createError({ statusCode: 404, message: "Admin not found" });
  }

  // 4) Snapshot target user info for response/audit
  const { data: targetUser, error: targetUserErr } = await adminClient
    .from("users")
    .select("id, email, first_name, last_name")
    .eq("id", targetId)
    .maybeSingle();

  if (targetUserErr) {
    throw createError({ statusCode: 500, message: targetUserErr.message });
  }

  const u = targetUser as null | {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  };

  const displayName =
    [u?.first_name, u?.last_name].filter(Boolean).join(" ") ||
    u?.email ||
    targetId;

  // 5) Delete from Supabase Auth — cascades to public.users → public.admins automatically
  const { error: deleteAuthError } =
    await adminClient.auth.admin.deleteUser(targetId);
  if (
    deleteAuthError &&
    !/user not found/i.test(deleteAuthError.message || "")
  ) {
    throw createError({
      statusCode: 500,
      message: `Auth user deletion failed: ${deleteAuthError.message}`,
    });
  }

  // 6) Audit/notify actor
  const message = `Admin permanently deleted: ${displayName}.`;

  const { error: notifErr } = await adminClient
    .from("notifications")
    .insert([{ user_id: actorUserId, message }]);

  if (notifErr) {
    throw createError({
      statusCode: 500,
      message: `Admin deleted, but notification/audit log failed: ${notifErr.message}`,
    });
  }

  return {
    ok: true,
    message,
    adminId: targetId,
    deletedUserId: targetId,
  };
});
