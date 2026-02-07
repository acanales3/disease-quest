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
        .single() as { data: { id: any, instructor_id: string } | null, error: any }

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
        users:users!inner (
            email,
            school
        )
      )
    `)
        .eq('classroom_id', classroomId)

    if (studentsError) {
        console.error('Roster fetch error:', studentsError)
        throw createError({
            statusCode: 500,
            message: studentsError.message,
        })
    }

    const filtered = students.filter((record: any) => record.student)

    return filtered.map((record: any) => {
        const s = record.student
        const userData = s.users || {}
        return {
            id: s.user_id,
            name: s.nickname,
            email: userData.email,
            school: userData.school || '',
            msyear: s.msyear,
            status: s.status
        }
    })
})
