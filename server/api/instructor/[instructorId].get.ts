import { serverSupabaseClient } from '#supabase/server'
import { Database } from '@/assets/types/supabase'

export default defineEventHandler(async (event) => {
    const instructorId = event.context.params?.instructorId

    if (!instructorId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Instructor ID required',
        })
    }

    const supabase = await serverSupabaseClient<Database>(event)

    // Auth check
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        })
    }

    // Get requester role
    const { data: requester, error: requesterError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (requesterError || !requester) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Invalid requester',
        })
    }

    // Admin authorization check
    if (requester.role !== 'ADMIN') {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden: Admin access required',
        })
    }

    // Fetch instructor profile with related data
    const { data: instructorData, error: fetchError } = await supabase
        .from('instructors')
        .select(
            `
      user_id,
      status,
      user:users (
        id,
        name,
        email,
        role
      )
    `,
        )
        .eq('user_id', instructorId)
        .single()

    if (fetchError) {
        if (fetchError.code === 'PGRST116') {
            // No rows returned
            throw createError({
                statusCode: 404,
                statusMessage: 'Instructor not found',
            })
        }
        throw createError({
            statusCode: 500,
            statusMessage: `Database error: ${fetchError.message}`,
        })
    }

    if (!instructorData) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Instructor not found',
        })
    }

    // Fetch assigned classrooms
    const { data: classrooms, error: classroomError } = await supabase
        .from('classrooms')
        .select('id, name, code, school, section, status')
        .eq('instructor_id', instructorId)

    if (classroomError) {
        throw createError({
            statusCode: 500,
            statusMessage: `Failed to fetch classrooms: ${classroomError.message}`,
        })
    }

    return {
        instructorId: instructorData.user_id,
        name: instructorData.user.name,
        email: instructorData.user.email,
        role: instructorData.user.role,
        status: instructorData.status,
        assignedClassrooms: classrooms || [],
    }
})
