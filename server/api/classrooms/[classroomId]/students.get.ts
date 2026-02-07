import { serverSupabaseUser, serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)
    // Use Service Role to match index.get.ts and bypass RLS for instructor/admin queries
    const client = serverSupabaseServiceRole(event)

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
        .from("students")
        .select(
            `
      user_id,
      nickname,
      msyear,
      status,
      users:users!inner (
        first_name,
        last_name,
        email,
        school,
        role
      ),
      classroom_students!inner (
        classroom_id
      )
    `
        )
        .eq("users.role", "STUDENT")
        .eq("classroom_students.classroom_id", classroomId)
        .order("user_id", { ascending: true });


    if (studentsError) {
        throw createError({
            statusCode: 500,
            message: studentsError.message,
        })
    }

    return (students ?? []).map((row: any) => {
        const userData = row.users || {}
        const first = userData.first_name ?? ""
        const last = userData.last_name ?? ""
        const name = `${first} ${last}`.trim() || row.nickname || "Unknown"

        return {
            id: row.user_id,
            name: name,
            email: userData.email,
            school: userData.school || '',
            msyear: row.msyear,
            status: row.status
        }
    })
})
