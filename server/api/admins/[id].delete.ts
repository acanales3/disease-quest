// server/api/admins/[id].delete.ts
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const authedClient = await serverSupabaseClient(event)

  // @ts-ignore (supabase user shape can vary)
  const actorUserId: string | undefined = (user as any)?.id || (user as any)?.sub
  if (!actorUserId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const targetId = getRouterParam(event, 'id')
  if (!targetId) {
    throw createError({ statusCode: 400, message: 'Missing admin id' })
  }

  // 1) Only admins can delete admins (check actor is admin)
  const { data: actorIsAdminRow, error: actorIsAdminErr } = await authedClient
    .from('admins')
    .select('user_id')
    .eq('user_id', actorUserId)
    .maybeSingle()

  if (actorIsAdminErr) {
    throw createError({ statusCode: 500, message: actorIsAdminErr.message })
  }
  if (!actorIsAdminRow) {
    throw createError({ statusCode: 403, message: 'Forbidden: Admin only' })
  }

  // Optional: prevent self-delete (remove if you want to allow it)
  if (actorUserId === targetId) {
    throw createError({ statusCode: 400, message: 'Admins cannot delete themselves' })
  }

  // 2) Service role client for destructive ops (bypass RLS)
  const config = useRuntimeConfig()

  const url =
    (config as any)?.supabase?.url ||
    (config as any)?.public?.supabase?.url

  const serviceKey =
    (config as any)?.supabase?.serviceRoleKey ||
    (config as any)?.supabase?.serviceKey ||
    (config as any)?.supabase?.key

  if (!url || !serviceKey) {
    throw createError({
      statusCode: 500,
      message:
        'Missing Supabase service role config. Expected config.supabase.url and config.supabase.serviceRoleKey (or serviceKey).',
    })
  }

  const adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false },
  })

  // 3) Ensure target exists as admin
  const { data: targetAdmin, error: targetAdminErr } = await adminClient
    .from('admins')
    .select('user_id')
    .eq('user_id', targetId)
    .maybeSingle()

  if (targetAdminErr) {
    throw createError({ statusCode: 500, message: targetAdminErr.message })
  }
  if (!targetAdmin) {
    throw createError({ statusCode: 404, message: 'Admin not found' })
  }

  // 4) Snapshot target user info for response/audit
  const { data: targetUser, error: targetUserErr } = await adminClient
    .from('users')
    .select('id, email, first_name, last_name')
    .eq('id', targetId)
    .maybeSingle()

  if (targetUserErr) {
    throw createError({ statusCode: 500, message: targetUserErr.message })
  }

  const u = targetUser as null | {
    id: string
    email: string | null
    first_name: string | null
    last_name: string | null
  }

  const displayName =
    [u?.first_name, u?.last_name].filter(Boolean).join(' ') ||
    u?.email ||
    targetId

  // 5) Delete from users (cascades to admins via FK ON DELETE CASCADE)
  const { data: deletedUsers, error: deleteUserErr } = await adminClient
    .from('users')
    .delete()
    .eq('id', targetId)
    .select('id')

  if (deleteUserErr) {
    throw createError({ statusCode: 500, message: `Delete users failed: ${deleteUserErr.message}` })
  }
  if (!deletedUsers || deletedUsers.length === 0) {
    throw createError({
      statusCode: 500,
      message: 'Delete users affected 0 rows (unexpected). Admin was not deleted.',
    })
  }

  // 6) Optional: audit/notify actor (if you have notifications table)
  // If you *don’t* want this, delete this block.
  const message = `Admin permanently deleted: ${displayName}.`

  const { error: notifErr } = await adminClient
    .from('notifications')
    .insert([{ user_id: actorUserId, message }])

  if (notifErr) {
    // Admin is already deleted; return success but warn, or treat as error.
    // Here we match your example and treat as error.
    throw createError({
      statusCode: 500,
      message: `Admin deleted, but notification/audit log failed: ${notifErr.message}`,
    })
  }

  return {
    ok: true,
    message,
    adminId: targetId,
    deletedUserId: targetId,
  }
})
