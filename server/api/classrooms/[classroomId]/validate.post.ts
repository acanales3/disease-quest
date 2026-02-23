import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)
    const client = await serverSupabaseClient(event)
    const classroomId = event.context.params?.classroomId

    // @ts-ignore
    const userId = user.id || user.sub

    if (!userId) {
        throw createError({
            statusCode: 401,
            message: 'Unauthorized',
        })
    }

    if (!classroomId) {
        throw createError({
            statusCode: 400,
            message: 'Missing classroom ID',
        })
    }

    // Fetch user profile for role check
    const { data: userProfile, error: profileError } = (await client
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()) as { data: { role: string } | null; error: any }

    if (profileError || !userProfile) {
        throw createError({
            statusCode: 403,
            message: 'Forbidden: User profile not found',
        })
    }

    const role = userProfile.role?.toUpperCase()

    // Fetch classroom to check ownership for instructors
    const { data: classroom, error: classroomError } = (await client
        .from('classrooms')
        .select('id, instructor_id')
        .eq('id', classroomId)
        .single()) as { data: any; error: any }

    if (classroomError || !classroom) {
        throw createError({
            statusCode: 404,
            message: 'Classroom not found',
        })
    }

    // Check permissions
    if (role === 'INSTRUCTOR' && classroom.instructor_id !== userId) {
        throw createError({
            statusCode: 403,
            message:
                'Forbidden: You do not have permission to edit this classroom',
        })
    }

    if (role !== 'ADMIN' && role !== 'INSTRUCTOR') {
        throw createError({
            statusCode: 403,
            message:
                'Forbidden: Only admins and instructors can edit classrooms',
        })
    }

    // Parse request body
    const body = await readBody(event)
    const { name, code, section, school, start_date, end_date, status } = body

    const errors: Record<string, string> = {}

    // Validate inputs (all optional, but validate if provided)
    if (name !== undefined && name !== null) {
        if (name.trim() === '') {
            errors.name = 'Classroom name cannot be empty'
        } else if (name.length > 255) {
            errors.name = 'Classroom name cannot exceed 255 characters'
        }
    }

    if (code !== undefined && code !== null) {
        if (code.trim() === '') {
            errors.code = 'Course code cannot be empty'
        }
    }

    if (section !== undefined && section !== null) {
        if (section.trim() === '') {
            errors.section = 'Section cannot be empty'
        }
    }

    if (school !== undefined && school !== null) {
        if (school.trim() === '') {
            errors.school = 'School cannot be empty'
        }
    }

    if (start_date !== undefined && start_date !== null) {
        if (isNaN(Date.parse(start_date))) {
            errors.start_date = 'Invalid start date format'
        }
    }

    if (end_date !== undefined && end_date !== null) {
        if (isNaN(Date.parse(end_date))) {
            errors.end_date = 'Invalid end date format'
        }
    }

    if (start_date && end_date && start_date > end_date) {
        errors.end_date = 'End date must be after start date'
    }

    if (status !== undefined && status !== null) {
        if (!['active', 'inactive'].includes(status)) {
            errors.status = 'Status must be either active or inactive'
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
    }
})
