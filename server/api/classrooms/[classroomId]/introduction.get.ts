import { defineEventHandler, createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const client = await serverSupabaseClient(event)

  // @ts-ignore
  const userId = user?.id || user?.sub

  if (!userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const classroomId = getRouterParam(event, 'classroomId')
  if (!classroomId) {
    throw createError({ statusCode: 400, message: 'Classroom ID is required' })
  }

  const { data: userProfile, error: profileError } = await client
    .from('users')
    .select('role')
    .eq('id', userId)
    .single() as { data: { role: string } | null, error: any }

  if (profileError || !userProfile) {
    throw createError({ statusCode: 403, message: 'Forbidden: User profile not found' })
  }

  const role = userProfile.role?.toUpperCase()
  if (role !== 'STUDENT') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const { data: classroom, error: classroomError } = await client
    .from('classrooms')
    .select('id')
    .eq('id', classroomId)
    .single()

  if (classroomError || !classroom) {
    throw createError({ statusCode: 404, message: 'Classroom not found' })
  }

  const { data: enrollment, error: enrollmentError } = await client
    .from('classroom_students')
    .select('classroom_id')
    .eq('classroom_id', classroomId)
    .eq('student_id', userId)
    .maybeSingle()

  if (enrollmentError) {
    throw createError({ statusCode: 500, message: enrollmentError.message })
  }

  if (!enrollment) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  throw createError({ statusCode: 404, message: 'Introduction not available.' })
})
