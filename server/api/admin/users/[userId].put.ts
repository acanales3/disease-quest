import { serverSupabaseClient } from '#supabase/server'
import { Database, TablesUpdate } from '@/assets/types/supabase'

type UserUpdate = TablesUpdate<'users'>
type StudentUpdate = TablesUpdate<'students'>
type InstructorUpdate = TablesUpdate<'instructors'>

type UserRole = Database['public']['Enums']['user_role']
type InstructorStatus = Database['public']['Enums']['instructor_status']
type StudentStatus = Database['public']['Enums']['student_status']

const VALID_ROLES: UserRole[] = ['ADMIN', 'INSTRUCTOR', 'STUDENT']
const VALID_INSTRUCTOR_STATUSES: InstructorStatus[] = ['active', 'deactivated']
const VALID_STUDENT_STATUSES: StudentStatus[] = ['registered', 'unregistered']

/**
 * PUT /api/admin/users/:userId
 *
 * Admin-only endpoint to update user account details.
 * Supports updating instructors and students.
 *
 * Editable fields: name (first_name, last_name), email, school, role, status.
 */
export default defineEventHandler(async (event) => {
  const targetUserId = getRouterParam(event, 'userId')

  if (!targetUserId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  // ── Auth ────────────────────────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  // ── Role check – admin only ─────────────────────────────────────────
  const { data: requester, error: requesterError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (requesterError || !requester) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: User profile not found',
    })
  }

  if (requester.role?.toUpperCase() !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Only admins can update user accounts',
    })
  }

  // ── Fetch the target user ───────────────────────────────────────────
  const { data: targetUser, error: targetError } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, name, school, role, created_at')
    .eq('id', targetUserId)
    .single()

  if (targetError || !targetUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
    })
  }

  // ── Read & validate body ────────────────────────────────────────────
  const body = await readBody<{
    first_name?: string
    last_name?: string
    email?: string
    school?: string
    role?: UserRole
    status?: string
  }>(event)

  if (!body || Object.keys(body).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Request body must contain at least one field to update',
    })
  }

  // Validate email format
  if (body.email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format',
      })
    }
  }

  // Validate role value
  if (body.role !== undefined) {
    if (!VALID_ROLES.includes(body.role)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`,
      })
    }
  }

  // Validate status based on role
  const effectiveRole = body.role ?? targetUser.role
  if (body.status !== undefined) {
    if (effectiveRole === 'INSTRUCTOR') {
      if (!VALID_INSTRUCTOR_STATUSES.includes(body.status as InstructorStatus)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Invalid status for instructor. Must be one of: ${VALID_INSTRUCTOR_STATUSES.join(', ')}`,
        })
      }
    } else if (effectiveRole === 'STUDENT') {
      if (!VALID_STUDENT_STATUSES.includes(body.status as StudentStatus)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Invalid status for student. Must be one of: ${VALID_STUDENT_STATUSES.join(', ')}`,
        })
      }
    } else if (effectiveRole === 'ADMIN') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Admin accounts do not have a status field',
      })
    }
  }

  // ── Duplicate email check ───────────────────────────────────────────
  if (body.email !== undefined && body.email !== targetUser.email) {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email)
      .neq('id', targetUserId)
      .maybeSingle()

    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A user with this email already exists',
      })
    }
  }

  // ── Update users table ──────────────────────────────────────────────
  const userUpdate: UserUpdate = {}

  if (body.first_name !== undefined) userUpdate.first_name = body.first_name
  if (body.last_name !== undefined) userUpdate.last_name = body.last_name
  if (body.email !== undefined) userUpdate.email = body.email
  if (body.school !== undefined) userUpdate.school = body.school
  if (body.role !== undefined) userUpdate.role = body.role

  // Derive the combined 'name' field when first or last name changes
  if (body.first_name !== undefined || body.last_name !== undefined) {
    const first = body.first_name ?? targetUser.first_name ?? ''
    const last = body.last_name ?? targetUser.last_name ?? ''
    userUpdate.name = `${first} ${last}`.trim()
  }

  if (Object.keys(userUpdate).length > 0) {
    const { error: userError } = await supabase
      .from('users')
      .update(userUpdate)
      .eq('id', targetUserId)

    if (userError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Error updating user: ${userError.message}`,
      })
    }
  }

  // ── Handle role change (migrate between role tables) ────────────────
  const currentRole = targetUser.role
  const newRole = body.role

  if (newRole && newRole !== currentRole) {
    // Remove from current role table
    if (currentRole === 'STUDENT') {
      await supabase.from('classroom_students').delete().eq('student_id', targetUserId)
      await supabase.from('students').delete().eq('user_id', targetUserId)
    } else if (currentRole === 'INSTRUCTOR') {
      await supabase.from('instructors').delete().eq('user_id', targetUserId)
    } else if (currentRole === 'ADMIN') {
      await supabase.from('admins').delete().eq('user_id', targetUserId)
    }

    // Insert into new role table
    if (newRole === 'STUDENT') {
      const { error } = await supabase.from('students').insert({ user_id: targetUserId })
      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: `Error creating student record: ${error.message}`,
        })
      }
    } else if (newRole === 'INSTRUCTOR') {
      const { error } = await supabase.from('instructors').insert({ user_id: targetUserId })
      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: `Error creating instructor record: ${error.message}`,
        })
      }
    } else if (newRole === 'ADMIN') {
      const { error } = await supabase.from('admins').insert({ user_id: targetUserId })
      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: `Error creating admin record: ${error.message}`,
        })
      }
    }
  }

  // ── Update role-specific status ─────────────────────────────────────
  if (body.status !== undefined) {
    const roleForStatus = body.role ?? currentRole

    if (roleForStatus === 'INSTRUCTOR') {
      const update: InstructorUpdate = { status: body.status as InstructorStatus }
      const { error } = await supabase
        .from('instructors')
        .update(update)
        .eq('user_id', targetUserId)

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: `Error updating instructor status: ${error.message}`,
        })
      }
    } else if (roleForStatus === 'STUDENT') {
      const update: StudentUpdate = { status: body.status as StudentStatus }
      const { error } = await supabase
        .from('students')
        .update(update)
        .eq('user_id', targetUserId)

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: `Error updating student status: ${error.message}`,
        })
      }
    }
  }

  // ── Return updated user record ──────────────────────────────────────
  const { data: updatedUser, error: fetchError } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, name, school, role, created_at')
    .eq('id', targetUserId)
    .single()

  if (fetchError || !updatedUser) {
    throw createError({
      statusCode: 500,
      statusMessage: 'User was updated but could not fetch the updated record',
    })
  }

  // Attach role-specific fields
  let status: string | null = null

  if (updatedUser.role === 'INSTRUCTOR') {
    const { data: instructor } = await supabase
      .from('instructors')
      .select('status')
      .eq('user_id', targetUserId)
      .single()
    status = instructor?.status ?? null
  } else if (updatedUser.role === 'STUDENT') {
    const { data: student } = await supabase
      .from('students')
      .select('status')
      .eq('user_id', targetUserId)
      .single()
    status = student?.status ?? null
  }

  return {
    success: true,
    user: {
      ...updatedUser,
      status,
    },
  }
})
