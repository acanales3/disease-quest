import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '@/assets/types/supabase'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event)

  const { studentId } = event.context.params as { studentId: string }
  const queryParams = getQuery(event)
  const caseId = queryParams.case_id ? Number(queryParams.case_id) : undefined
  const classroomId = queryParams.classroom_id ? Number(queryParams.classroomId) : undefined

  // build the query
  let query = supabase
    .from('evaluations')
    .select(`
      id,
      case_id,
      student_id,
      communication_empathy,
      diagnostic_tests,
      differential_diagnosis_formulation,
      history_taking_synthesis,
      management_reasoning,
      physical_exam_interpretation,
      reflection_metacognition,
      cases!inner (
        name,
        classroom_id,
        classrooms!inner (
          name
        )
      )
    `)
    .eq('student_id', studentId) // filter by the logged-in student

    if (caseId) {
      query = query.eq('case_id', caseId)
    }

    if (classroomId) {
      query = query.eq('cases.classroom_id', classroomId)
    }

    // Execute query
    const { data, error } = await query

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      })
    }

    const results = data.map(row => ({
      id: row.id,
      caseId: row.case_id,
      caseName: row.cases?.name,
      classroomId: row.cases?.classroom_id,
      classroomName: row.cases?.classrooms?.name,
      scores: {
        communicationEmpathy: row.communication_empathy,
        diagnosticTests: row.diagnostic_tests,
        differentialDiagnosisFormulation: row.differential_diagnosis_formulation,
        historyTakingSynthesis: row.history_taking_synthesis,
        managementReasoning: row.management_reasoning,
        physicalExamInterpretation: row.physical_exam_interpretation,
        reflectionMetacognition: row.reflection_metacognition
      }
    }))

    return results
})