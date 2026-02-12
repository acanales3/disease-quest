import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '@/assets/types/supabase'

interface StudentSearchRequest {
  instructorId: string
  firstname?: string
  lastname?: string
  email?: string
  registered?: boolean
  msyear?: number
  classroom?: number
  school?: string
  sort?: {
    field: 'firstname' | 'lastname' | 'email' | 'msyear'
    direction: 'asc' | 'desc'
  }
}

export default defineEventHandler(async (event) => {
  const instructorId = event.context.params?.id as string
  if (!instructorId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Instructor ID is required in the URL'
    })
  }

  const body = await readBody<StudentSearchRequest>(event)
  const supabase = await serverSupabaseClient<Database>(event)

  let query = supabase
    .from('students')
    .select(`
      user_id,
      msyear,
      status,
      users (
        first_name,
        last_name,
        email,
        school
      ),
      classroom_students (
        classroom_id,
        classrooms!inner (
          instructor_id
        )
      )
    `)
    .eq('classroom_students.classrooms.instructor_id', instructorId) // filter by instructor ownership

  /* ------------------ FILTERS ------------------ */

  if (body.firstname) {
    query = query.ilike('users.first_name', `%${body.firstname}%`)
  }

  if (body.lastname) {
    query = query.ilike('users.last_name', `%${body.lastname}%`)
  }

  if (body.email) {
    query = query.ilike('users.email', `%${body.email}%`)
  }

  if (body.school) {
    query = query.ilike('users.school', `%${body.school}%`)
  }

  if (body.msyear !== undefined) {
    query = query.eq('msyear', body.msyear)
  }

  if (body.registered !== undefined) {
    query = query.eq(
      'status',
      body.registered ? 'registered' : 'unregistered'
    )
  }

  if (body.classroom) {
    query = query.eq(
      'classroom_students.classroom_id',
      body.classroom
    )
  }

  /* ------------------ SORTING ------------------ */

  if (body.sort) {
    const { field, direction } = body.sort

    const sortMap: Record<string, string> = {
      firstname: 'users.first_name',
      lastname: 'users.last_name',
      email: 'users.email',
      msyear: 'msyear',
    }

    const column = sortMap[field]

    if (column) {
      query = query.order(column, {
        ascending: direction === 'asc',
      })
    }
  }

  const { data, error } = await query
  
  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  const results = data.map((row) => ({
    id: row.user_id,
    firstName: row.users?.first_name,
    lastName: row.users?.last_name,
    email: row.users?.email,
    school: row.users?.school,
    msyear: row.msyear,
    status: row.status,
    classrooms: row.classroom_students?.map((c) => c.classroom_id) ?? [],
  }))

  return results
})