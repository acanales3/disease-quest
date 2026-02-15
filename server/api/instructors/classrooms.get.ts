import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '@/assets/types/supabase'

export default defineEventHandler(async (event) => {
    const supabase = await serverSupabaseClient<Database>(event)

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        })
    }

    const { data: requester, error: requesterError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (requesterError || !requester || requester.role !== 'INSTRUCTOR') {
        throw createError ({ 
            statusCode: 403, 
            statusMessage: 'Forbidden: Instructor access required'
        })
    }

    const instructorId = user.id

    const { data: classroomData, error: classroomError } = await supabase
        .from('classrooms')
        .select(`
            id,
            name
        `)
        .eq('instructor_id', instructorId)

    if (classroomError) {
        throw createError({
            statusCode: 500,
            statusMessage: `Failed to fetch classrooms: ${classroomError.message}`
        })
    }

    return {
        classrooms: classroomData ?? []
    }

})