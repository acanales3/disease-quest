import { defineEventHandler, createError } from 'h3'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const client = await serverSupabaseClient(event)

  const userId = user?.id || user?.sub
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const classroomId = getRouterParam(event, 'id')
  if (!classroomId) {
    throw createError({ statusCode: 400, message: 'Classroom ID is required' })
  }

  const { data: userProfile, error: profileError } = (await client
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()) as { data: { role: string } | null; error: any }

  if (profileError || !userProfile) {
    throw createError({ statusCode: 403, message: 'Forbidden: User profile not found' })
  }

  const role = userProfile.role?.toUpperCase()
  const isAdmin = role === 'ADMIN'
  const isInstructor = role === 'INSTRUCTOR'

  if (!isAdmin && !isInstructor) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const { data: classroom, error: classroomError } = (await client
    .from('classrooms')
    .select('id, name, code, instructor_id')
    .eq('id', classroomId)
    .single()) as {
    data: {
      id: number
      name: string
      code: string
      instructor_id: string
    } | null
    error: any
  }

  if (classroomError || !classroom) {
    throw createError({ statusCode: 404, message: 'Classroom not found' })
  }

  if (isInstructor && classroom.instructor_id !== userId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: You are not authorized to view this classroom',
    })
  }

  const { data: students, error: studentsError } = await client
    .from('classroom_students')
    .select(`
      student:students (
        user_id,
        nickname,
        msyear,
        status,
        user:users (
          email
        )
      )
    `)
    .eq('classroom_id', classroomId)

  if (studentsError) {
    throw createError({ statusCode: 500, message: studentsError.message })
  }

  const enrolledStudents = (students ?? []).map((record: any) => {
    const s = record.student
    const userData = s.user || {}
    return {
      id: s.user_id,
      name: s.nickname,
      email: userData.email,
      msyear: s.msyear,
      status: s.status,
    }
  })

  const msyears = enrolledStudents
    .map((s) => s.msyear)
    .filter((v) => typeof v === 'number')
  const uniqueMsyears = Array.from(new Set(msyears))
  const msyear = uniqueMsyears.length === 1 ? uniqueMsyears[0] : null

  return {
    id: classroom.id,
    name: classroom.name,
    subject: classroom.code,
    msyear,
    students: enrolledStudents,
  }
})
