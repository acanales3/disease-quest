import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)
    const client = await serverSupabaseClient(event)

    // @ts-ignore
    const userId = user.id || user.sub

    if (!userId) {
        throw createError({
            statusCode: 401,
            message: 'Unauthorized',
        })
    }

    const classroomId = getRouterParam(event, 'classroomId')

    if (!classroomId) {
        throw createError({
            statusCode: 400,
            message: 'Classroom ID is required',
        })
    }

    // fetch user profile for role check
    const { data: userProfile, error: profileError } = await client
        .from('users')
        .select('role')
        .eq('id', userId)
        .single() as { data: { role: string } | null, error: any }

    if (profileError || !userProfile) {
        throw createError({
            statusCode: 403,
            message: 'Forbidden: User profile not found',
        })
    }

    const role = userProfile.role?.toUpperCase()

    // verify role
    const { data: classroom, error: classroomError } = await client
        .from('classrooms')
        .select('id, instructor_id')
        .eq('id', classroomId)
        .single()

    if (classroomError || !classroom) {
        throw createError({
            statusCode: 404,
            message: 'Classroom not found',
        })
    }

    const isInstructorOfClass = classroom.instructor_id === userId
    const isAdmin = role === 'ADMIN'

    if (!isAdmin && !isInstructorOfClass) {
        throw createError({
            statusCode: 403,
            message: 'Forbidden: You are not authorized to view this classroom',
        })
    }

    // fetch roster
    const { data: students, error: studentsError } = await client
        .from('classroom_students')
        .select(`
      student:students (
        user_id,
        nickname,
        msyear,
        status,
        user:users (
            email,
            raw_user_meta_data
        )
      )
    `)
        .eq('classroom_id', classroomId)

    if (studentsError) {
        throw createError({
            statusCode: 500,
            message: studentsError.message,
        })
    }

    return students.map((record: any) => {
        const s = record.student
        const userData = s.user || {}
        return {
            id: s.user_id,
            name: s.nickname,
            email: userData.email,
            msyear: s.msyear,
            status: s.status
        }
    })
})
