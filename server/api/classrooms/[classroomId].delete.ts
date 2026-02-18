import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const client = await serverSupabaseClient(event)

  // @ts-ignore - supabase user can be { id } or { sub }
  const requesterId = user?.id || user?.sub

  if (!requesterId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const classroomId = getRouterParam(event, 'classroomId')

  if (!classroomId) {
    throw createError({
      statusCode: 400,
      message: 'Classroom ID is required',
    })
  }

  // Fetch requester profile for role check
  const { data: userProfile, error: profileError } = await client
    .from('users')
    .select('role')
    .eq('id', requesterId)
    .single() as { data: { role: string } | null; error: any }

  if (profileError || !userProfile) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: User profile not found',
    })
  }

  const role = userProfile.role?.toUpperCase()

  if (role !== 'ADMIN' && role !== 'INSTRUCTOR') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Only admins and instructors can delete classrooms',
    })
  }

  // Verify the classroom exists
  const { data: classroom, error: classroomError } = await client
    .from('classrooms')
    .select('id, instructor_id')
    .eq('id', classroomId)
    .single() as { data: { id: number; instructor_id: string } | null; error: any }

  if (classroomError || !classroom) {
    throw createError({
      statusCode: 404,
      message: 'Classroom not found',
    })
  }

  // Instructors can only delete their own classrooms
  if (role === 'INSTRUCTOR' && classroom.instructor_id !== requesterId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: You can only delete classrooms you own',
    })
  }

  // Remove all student enrollments for this classroom first
  const { error: enrollmentError } = await client
    .from('classroom_students')
    .delete()
    .eq('classroom_id', classroomId)

  if (enrollmentError) {
    throw createError({
      statusCode: 500,
      message: `Error removing classroom enrollments: ${enrollmentError.message}`,
    })
  }

  // Delete the classroom itself
  const { error: deleteError } = await client
    .from('classrooms')
    .delete()
    .eq('id', classroomId)

  if (deleteError) {
    throw createError({
      statusCode: 500,
      message: `Error deleting classroom: ${deleteError.message}`,
    })
  }

  return {
    success: true,
    message: `Classroom ${classroomId} has been deleted.`,
  }
})
