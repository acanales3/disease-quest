import { defineEventHandler, createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

const scoreFields = [
  'communication_empathy',
  'diagnostic_tests',
  'differential_diagnosis_formulation',
  'history_taking_synthesis',
  'management_reasoning',
  'physical_exam_interpretation',
  'reflection_metacognition',
] as const

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const client = await serverSupabaseClient(event)

  // @ts-ignore
  const requesterId = user?.id || user?.sub
  if (!requesterId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const studentId = getRouterParam(event, 'id')
  if (!studentId) {
    throw createError({ statusCode: 400, message: 'Student ID is required' })
  }

  const { data: rows, error } = await client
    .from('evaluations')
    .select(`
      id,
      case_id,
      created_at,
      reflection_document,
      communication_empathy,
      diagnostic_tests,
      differential_diagnosis_formulation,
      history_taking_synthesis,
      management_reasoning,
      physical_exam_interpretation,
      reflection_metacognition,
      cases (
        name
      )
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  if (!rows || rows.length === 0) {
    return []
  }

  const caseIds = rows.map(r => r.case_id).filter(Boolean)
  const { data: progressRows, error: progressError } = await client
    .from('student_cases')
    .select('case_id, started_at, completed_at')
    .eq('student_id', studentId)
    .in('case_id', caseIds)

  if (progressError) {
    throw createError({ statusCode: 500, message: progressError.message })
  }

  const progressByCase = new Map<number, { started_at: any; completed_at: any }>()
  for (const p of progressRows ?? []) {
    progressByCase.set((p as any).case_id, {
      started_at: (p as any).started_at,
      completed_at: (p as any).completed_at,
    })
  }

  return rows.map((row: any) => {
    const scores = scoreFields
      .map((field) => row[field])
      .filter((value) => typeof value === 'number')
    const score =
      scores.length > 0
        ? Number((scores.reduce((sum, v) => sum + v, 0) / scores.length).toFixed(2))
        : null

    const progressRow = progressByCase.get(row.case_id)
    let progress: 'not started' | 'in progress' | 'completed' = 'completed'
    if (progressRow) {
      if (progressRow.completed_at) progress = 'completed'
      else if (progressRow.started_at) progress = 'in progress'
      else progress = 'not started'
    }

    return {
      activityName: row.cases?.name ?? '',
      date: row.created_at,
      score,
      feedback: row.reflection_document,
      progress,
    }
  })
})
