import { serverSupabaseClient } from '#supabase/server';
import { Database, TablesUpdate } from '@/assets/types/supabase';

type UserUpdate = TablesUpdate<'users'>
type InstructorUpdate = TablesUpdate<'instructors'>

export default defineEventHandler(async (event) => {
  const instructorId = event.context.params?.id
  if (!instructorId) {
    throw createError({ statusCode: 400, statusMessage: 'Instructor ID required' })
  }

  const supabase = await serverSupabaseClient<Database>(event);

  // Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Get requester role
  const { data: requester, error: requesterError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (requesterError || !requester) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid requester' })
  }

  const isAdmin = requester.role === 'ADMIN'
  const isSelf = user.id === instructorId

  // Permission check
  if (!isAdmin && !isSelf) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden from changing other account data'})
  }

  const body = await readBody<{
    first_name?: string;
    last_name?: string;
    email?: string
    school?: string
    status?: Database['public']['Enums']['instructor_status']
  }>(event)


  // Validation
  if (body.status && !isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only admins can update instructor status'
    })
  }

  if (body.email && !body.email.includes('@')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid email address',
    })
  }

  // Update users table
  const userUpdate: UserUpdate = {}
  if (body.first_name !== undefined) userUpdate.first_name = body.first_name
  if (body.last_name !== undefined) userUpdate.last_name = body.last_name

  // Derive 'name' field in user table from first and last name
  if (body.first_name !== undefined || body.last_name !== undefined) {
    const currentName = await supabase.from('users').select('first_name,last_name').eq('id', instructorId).single();
    const first = body.first_name ?? currentName.data?.first_name ?? '';
    const last = body.last_name ?? currentName.data?.last_name ?? '';
    userUpdate.name = `${first} ${last}`.trim();
    
  }

  if (body.email !== undefined) userUpdate.email = body.email
  if (body.school !== undefined) userUpdate.school = body.school

  if (Object.keys(userUpdate).length > 0) {
    const { error: userError } = await supabase
      .from('users')
      .update(userUpdate)
      .eq('id', instructorId)

    if (userError) {
      throw createError({ statusCode: 500, statusMessage: userError.message })
    }
  }

  // Update instructors table (admin only fields)
  if (body.status !== undefined) {
    const instructorUpdate: InstructorUpdate = {
      status: body.status,
    }

    const { error: instructorError } = await supabase
      .from('instructors')
      .update(instructorUpdate)
      .eq('user_id', instructorId)

    if (instructorError) {
      throw createError({ statusCode: 500, statusMessage: instructorError.message })
    }
  }

  return { success: true }
})