import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '@/assets/types/supabase'

export default defineEventHandler(async (event) => {
    const classroomId = Number(getRouterParam(event, "classroomId"));

    if (!classroomId || isNaN(classroomId)) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid classroom ID"
        });
    }

    const supabase = await serverSupabaseClient<Database>(event);


    const { data: classroomCases, error: classroomCasesError } = await supabase
        .from('classroom_cases')
        .select(`
            cases (
                id,
                name,
                description
            )
        `).eq("classroom_id", classroomId);

    if (classroomCasesError) {
        throw createError({ statusCode: 500, statusMessage: classroomCasesError.message })
    }

    const cases = classroomCases?.map((row) => row.cases).filter(Boolean) ?? [];
    return cases;
});