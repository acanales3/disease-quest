import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '@/assets/types/supabase'

export default defineEventHandler(async (event) => {
    const supabase = await serverSupabaseClient<Database>(event)
    const user = await serverSupabaseUser(event)

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const userId = user.sub;

    const caseIdParam = event.context.params?.id;
    const caseId = caseIdParam ? Number(caseIdParam) : null;

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
        .eq('user_id', userId)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false }) // sort by newest first
        .limit(1) // only get most recent

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    if (!data || data.length == 0) {
        throw createError({
            statusCode: 404,
            statusMessage: "Evaluations not found!"
        })
    }

    const latestEvaluation = data[0];

    return {
        caseId: latestEvaluation.case_id,
        caseName: latestEvaluation.cases?.name,
        classroomId: latestEvaluation.cases?.classroom_cases?.[0]?.classrooms?.id,
        classroomName: latestEvaluation.cases?.classroom_cases?.[0]?.classrooms?.name,
        count: 1, // single evaluation = 1
        history_taking_synthesis: (latestEvaluation.history_taking_synthesis ?? 0) * 100,
        physical_exam_interpretation: (latestEvaluation.physical_exam_interpretation ?? 0) * 100,
        differential_diagnosis_formulation: (latestEvaluation.differential_diagnosis_formulation ?? 0) * 100,
        diagnostic_tests: (latestEvaluation.diagnostic_tests ?? 0) * 100,
        management_reasoning: (latestEvaluation.management_reasoning ?? 0) * 100,
        communication_empathy: (latestEvaluation.communication_empathy ?? 0) * 100,
        reflection_metacognition: (latestEvaluation.reflection_metacognition ?? 0) * 100
    }
})