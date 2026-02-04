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

    const mapClassroom = (c: any) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        instructor: c.instructor?.user?.name || 'Unknown',
        school: c.school,
        section: c.section,
        startDate: c.start_date,
        endDate: c.end_date,
        status: c.status
    })

    const selectQuery = `
        *,
        instructor:instructors (
            user:users (
                name
            )
        )
    `

    // fetch all classrooms if role is admin
    if (role === 'ADMIN') {
        const { data: classrooms, error } = await client
            .from('classrooms')
            .select(selectQuery)
            .order('id', { ascending: true })

        if (error) {
            throw createError({
                statusCode: 500,
                message: error.message
            })
        }
        return classrooms.map(mapClassroom)
    }

    // fetch all owned classrooms if role is instructor
    if (role === 'INSTRUCTOR') {
        const { data: classrooms, error } = await client
            .from('classrooms')
            .select(selectQuery)
            .eq('instructor_id', userId)
            .order('id', { ascending: true })

        if (error) {
            throw createError({
                statusCode: 500,
                message: error.message
            })
        }
        return classrooms.map(mapClassroom)
    }

    // fetch all enrolled classrooms if role is student
    if (role === 'STUDENT') {
        // get classrooms the student is enrolled in
        const { data: enrollments, error } = await client
            .from('classroom_students')
            .select(`
                classrooms (
                    ${selectQuery}
                )
            `)
            .eq('student_id', userId)

        if (error) {
            throw createError({
                statusCode: 500,
                message: error.message
            })
        }

        // enrollments will be an array of objects like { classrooms: { ... } }
        // We need to extract the 'classrooms' property, handling potential nulls
        // @ts-ignore
        return (enrollments as any[])
            .map(e => e.classrooms)
            .filter(Boolean)
            .map(mapClassroom)
            .sort((a, b) => a.id - b.id)
    }

    // If no role matches (or other roles), return empty list or 403.
    // Assuming return empty list for safety.
    return []
})
