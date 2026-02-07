import { defineEventHandler, createError, getRouterParam } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const authedClient = await serverSupabaseClient(event)

  // @ts-ignore
  const actorUserId = user?.id || user?.sub
  if (!actorUserId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const instructorId = getRouterParam(event, 'id')
  if (!instructorId) {
    throw createError({ statusCode: 400, message: 'Missing instructor id' })
  }

  // 1) Admin role check (authed client)
  const { data: actorProfile, error: actorProfileError } = await authedClient
    .from('users')
    .select('role')
    .eq('id', actorUserId)
    .single() as { data: { role: string } | null; error: any }

  if (actorProfileError || !actorProfile) {
    throw createError({ statusCode: 403, message: 'Forbidden: User profile not found' })
  }

  const actorRole = actorProfile.role?.toUpperCase()
  if (actorRole !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Forbidden: Admin only' })
  }

  // 2) Service role client for destructive ops (bypass RLS)
  const config = useRuntimeConfig()

  // Common Nuxt/Supabase runtime config keys:
  // - config.supabase.url
  // - config.supabase.serviceKey OR config.supabase.serviceRoleKey
  const url =
    (config as any)?.supabase?.url ||
    (config as any)?.public?.supabase?.url

  const serviceKey =
    (config as any)?.supabase?.serviceRoleKey ||
    (config as any)?.supabase?.serviceKey ||
    (config as any)?.supabase?.key // last resort (ONLY if you actually stored service role here)

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

  // 3) Ensure target exists as instructor
  const { data: targetInstructor, error: targetInstructorError } = await adminClient
    .from('instructors')
    .select('user_id')
    .eq('user_id', instructorId)
    .maybeSingle()

  if (targetInstructorError) throw createError({ statusCode: 500, message: targetInstructorError.message })
  if (!targetInstructor) throw createError({ statusCode: 404, message: 'Instructor not found' })

  // 4) Snapshot target user info for message
  const { data: targetUser, error: targetUserErr } = await adminClient
    .from('users')
    .select('id, email, first_name, last_name')
    .eq('id', instructorId)
    .maybeSingle()

  if (targetUserErr) throw createError({ statusCode: 500, message: targetUserErr.message })

  const u = targetUser as null | {
    id: string
    email: string | null
    first_name: string | null
    last_name: string | null
  }

  const displayName =
    [u?.first_name, u?.last_name].filter(Boolean).join(' ') ||
    u?.email ||
    instructorId

  // 5) Find classrooms for instructor
  const { data: classrooms, error: classroomsErr } = await adminClient
    .from('classrooms')
    .select('id')
    .eq('instructor_id', instructorId)

  if (classroomsErr) throw createError({ statusCode: 500, message: classroomsErr.message })

  const classroomIds = (classrooms ?? []).map((c: any) => c.id as number)
  const classroomsDeleted = classroomIds.length

  let enrollmentsRemoved = 0
  let classroomCasesDeleted = 0

  if (classroomIds.length > 0) {
    const [{ count: eCount, error: eErr }, { count: ccCount, error: ccErr }] = await Promise.all([
      adminClient
        .from('classroom_students')
        .select('*', { count: 'exact', head: true })
        .in('classroom_id', classroomIds),
      adminClient
        .from('classroom_cases')
        .select('*', { count: 'exact', head: true })
        .in('classroom_id', classroomIds),
    ])

    if (eErr) throw createError({ statusCode: 500, message: eErr.message })
    if (ccErr) throw createError({ statusCode: 500, message: ccErr.message })

    enrollmentsRemoved = eCount ?? 0
    classroomCasesDeleted = ccCount ?? 0

    // Delete classroom_cases first (no ON DELETE CASCADE)
    const { error: delCCErr } = await adminClient
      .from('classroom_cases')
      .delete()
      .in('classroom_id', classroomIds)

    if (delCCErr) throw createError({ statusCode: 500, message: `Delete classroom_cases failed: ${delCCErr.message}` })

    // Delete classrooms (classroom_students will cascade)
    const { error: delClassroomsErr } = await adminClient
      .from('classrooms')
      .delete()
      .eq('instructor_id', instructorId)

    if (delClassroomsErr) throw createError({ statusCode: 500, message: `Delete classrooms failed: ${delClassroomsErr.message}` })
  }

  // 6) Delete user (cascades to instructors)
  const { data: deletedUsers, error: deleteUserErr } = await adminClient
    .from('users')
    .delete()
    .eq('id', instructorId)
    .select('id')

  if (deleteUserErr) throw createError({ statusCode: 500, message: `Delete users failed: ${deleteUserErr.message}` })
  if (!deletedUsers || deletedUsers.length === 0) {
    throw createError({ statusCode: 500, message: 'Delete users affected 0 rows (unexpected). Instructor was not deleted.' })
  }

  // 7) Audit/notify admin
  const message =
  `Instructor permanently deleted: ${displayName}. ` +
  `Classrooms deleted: ${classroomsDeleted}. ` +
  `Students unenrolled (enrollment rows removed): ${enrollmentsRemoved}. ` +
  `Classroom-case links deleted: ${classroomCasesDeleted}.`


  const { error: notifErr } = await adminClient
    .from('notifications')
    .insert([{ user_id: actorUserId, message }])

  if (notifErr) {
    throw createError({
      statusCode: 500,
      message: `Instructor deleted, but notification/audit log failed: ${notifErr.message}`,
    })
  }

  return {
    ok: true,
    message,
    instructorId,
    classroomsDeleted,
    enrollmentsRemoved,
    classroomCasesDeleted,
  }
})
