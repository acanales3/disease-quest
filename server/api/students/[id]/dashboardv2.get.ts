import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '@/assets/types/supabase'

export default defineEventHandler(async (event) => {
  const studentId = event.context.params?.studentId

  if (!studentId) {
    throw createError({statusCode: 400, statusMessage: 'Student ID is required'})
  }

  const supabase = await serverSupabaseClient<Database>(event)

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthenticated'})
  }

  if (user.id !== studentId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden'})
  }

  // Check that student exists
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('user_id')
    .eq('user_id', studentId)
    .single()

  if (studentError || !student) {
    throw createError({ statusCode: 404, statusMessage: 'Student not found'})
  }

  // Classroom enrollment
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('classroom_students')
    .select('classroom_id')
    .eq('student_id', studentId)

  if (enrollmentError) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to check classroom enrollment' })
  }

  if (!enrollments || enrollments.length === 0) {
    throw createError({ statusCode: 403, statusMessage: 'Student not enrolled in any classrooms' })
  }

  // Fetch cases + evaluations
  const { data: cases, error: casesError } = await supabase
    .from('student_cases')
    .select(`
      case_id,
      started_at,
      completed_at,
      evaluations (
        communication_empathy,
        diagnostic_tests,
        differential_diagnosis_formulation,
        history_taking_synthesis,
        management_reasoning,
        physical_exam_interpretation,
        reflection_metacognition
      )
    `)
    .eq('student_id', studentId)

  if (casesError) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to retrieve performance data'})
  }

  if (!cases || cases.length === 0) {
    return { statusCode: 204, message: 'No performance data available' }
  }

  // Aggregate data
  const completed = cases.filter(c => c.completed_at).length
  const inProgress = cases.filter(c => c.started_at && !c.completed_at).length

  const scoreTotals: Record<string, number> = {}
  let evalCount = 0

  cases.forEach(c => {
    if (c.evaluations) {
      evalCount++
      Object.entries(c.evaluations).forEach(([key, value]) => {
        if (typeof value === 'number') {
          scoreTotals[key] = (scoreTotals[key] || 0) + value
        }
      })
    }
  })

  const averageScores: Record<string, number> = {}
  Object.entries(scoreTotals).forEach(([key, total]) => {
    averageScores[key] = total / evalCount
  })

  return {
    classroomsEnrolled: enrollments.length,
    cases: {
      total: cases.length,
      completed,
      inProgress,
      notStarted: cases.length - completed - inProgress
    },
    performance: {
      averageScores
    },
    participationRate: completed / cases.length,
    simulationLogs: cases
  }
})