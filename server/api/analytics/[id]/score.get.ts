import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '@/assets/types/supabase'

export default defineEventHandler(async (event) => {
    const supabase = await serverSupabaseClient<Database>(event)
    const user = await serverSupabaseUser(event)

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const userId = user.id;

    const queryParams = getQuery(event)
    const caseId = queryParams.id ? Number(queryParams.id) : null

    if (!caseId) {
        throw createError({
            statusCode: 400,
            statusMessage: "Case ID is required."
        })
    }

    // build the query
    const { data, error } = await supabase
        .from('evaluations')
        .select(`
        id,
        case_id,
        communication_empathy,
        diagnostic_tests,
        differential_diagnosis_formulation,
        history_taking_synthesis,
        management_reasoning,
        physical_exam_interpretation,
        reflection_metacognition,
        cases!inner (
        id,
        name,
        classroom_cases!inner (
            classrooms!inner (
            id,
            name
            )
        )
        )
    `)
        .eq('student_id', userId)
        .eq('case_id', caseId)
        .single()

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    if (!data) {
        throw createError({
            statusCode: 404,
            statusMessage: "Evaluations not found!"
        })
    }

    return {
        id: data.id,
        caseId: data.case_id,
        caseName: data.cases?.name,
        classroomId: data.cases?.classroom_cases?.[0]?.classrooms?.id,
        classroomName: data.cases?.classroom_cases?.[0]?.classrooms?.name,
        scores: {
            communicationEmpathy: data.communication_empathy,
            diagnosticTests: data.diagnostic_tests,
            differentialDiagnosisFormulation: data.differential_diagnosis_formulation,
            historyTakingSynthesis: data.history_taking_synthesis,
            managementReasoning: data.management_reasoning,
            physicalExamInterpretation: data.physical_exam_interpretation,
            reflectionMetacognition: data.reflection_metacognition
        }
    }
})