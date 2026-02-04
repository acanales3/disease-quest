import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '@/assets/types/supabase'

type ClassroomCaseRow = {
  classroom_id: number
  cases: {
    id: number
    name: string
    description: string | null
  } | null
  classrooms: {
    name: string
  } | null
}

export default defineEventHandler(async (event) => {
  const studentId = event.context.params?.studentId
  //const supabase = await serverSupabaseClient<Database>(event) // TYPE SAFE
  const supabase = await serverSupabaseClient(event) as any // NOT TYPE SAFE

  if (!studentId) {
    throw createError({ statusCode: 400, statusMessage: 'Student ID required' })
  }

  // Auth
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== studentId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // User name
  const { data: userRow } = await supabase
    .from('users')
    .select('name')
    .eq('id', studentId)
    .single()

  // Classrooms
  const { data: classrooms } = await supabase
    .from('classroom_students')
    .select('classroom_id')
    .eq('student_id', studentId)

  if (!classrooms || classrooms.length == 0) {
    return {
      user: { name: userRow?.name },
      stats: null,
      cases: [],
      message: 'No classroom enrollment found',
    }
  }

  const classroomIds = classrooms.map(c => c.classroom_id)

  // // Available cases
  const { data: classroomCases } = await supabase
    .from('classroom_cases')
    .select(`
      classroom_id
      cases (
        id,
        name,
        description
      ),
      classrooms (
        name
      )
    `) .in('classroom_id', classroomIds)

  // Case data
  const { data: studentCases, error } = await supabase
    .from('student_cases')
    .select(`
      case_id,
      started_at,
      completed_at,
    `).eq('student_id', studentId)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const progressMap = new Map(
    (studentCases ?? []).map(sc => [sc.case_id, sc])
  )

  // Merge data
  const cases = classroomCases.map(row => {
    const c = row.cases!
    const progress = progressMap.get(c.id)

    let status: 'not started' | 'in progress' | 'completed' = 'not started'
    let completionDate = null

    if (progress) {
      if (progress.completed_at) {
        status = 'completed'
        completionDate = progress.completed_at
      } else if (progress.started_at) {
        status = 'in progress'
      }
     }

     return {
      id: c.id,
      name: c.name,
      description: c.description,
      classroom: row.classrooms?.name ?? null,
      completionDate,
      status,
     }
  })
})