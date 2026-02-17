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

    // Build update object with only provided fields
    const updateData: Record<string, any> = {}

    // Validate and add only provided fields
    if (name !== undefined && name !== null) {
        if (name.trim() === '') {
            throw createError({
                statusCode: 400,
                message: 'Classroom name cannot be empty',
            })
        }
        if (name.length > 255) {
            throw createError({
                statusCode: 400,
                message: 'Classroom name cannot exceed 255 characters',
            })
        }
        updateData.name = name.trim()
    }

    if (code !== undefined && code !== null) {
        if (code.trim() === '') {
            throw createError({
                statusCode: 400,
                message: 'Course code cannot be empty',
            })
        }
        updateData.code = code.trim()
    }

    if (section !== undefined && section !== null) {
        if (section.trim() === '') {
            throw createError({
                statusCode: 400,
                message: 'Section cannot be empty',
            })
        }
        updateData.section = section.trim()
    }

    if (school !== undefined && school !== null) {
        if (school.trim() === '') {
            throw createError({
                statusCode: 400,
                message: 'School cannot be empty',
            })
        }
        updateData.school = school.trim()
    }

    if (start_date !== undefined && start_date !== null) {
        if (isNaN(Date.parse(start_date))) {
            throw createError({
                statusCode: 400,
                message: 'Invalid start date format',
            })
        }
        updateData.start_date = start_date
    }

    if (end_date !== undefined && end_date !== null) {
        if (isNaN(Date.parse(end_date))) {
            throw createError({
                statusCode: 400,
                message: 'Invalid end date format',
            })
        }
        updateData.end_date = end_date
    }

    if (start_date && end_date && start_date > end_date) {
        throw createError({
            statusCode: 400,
            message: 'End date must be after start date',
        })
    }

    if (status !== undefined && status !== null) {
        if (!['active', 'inactive'].includes(status)) {
            throw createError({
                statusCode: 400,
                message: 'Status must be either active or inactive',
            })
        }
        updateData.status = status
    }

    // Check if at least one field is being updated
    if (Object.keys(updateData).length === 0) {
        throw createError({
            statusCode: 400,
            message: 'At least one field must be provided for update',
        })
    }

    const selectQuery = `
        *,
        instructor:instructors (
            user:users (
                name
            )
        )
    `

    const mapClassroom = (c: any) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        section: c.section,
        school: c.school,
        instructor: c.instructor?.user?.name || 'Unknown',
        startDate: c.start_date,
        endDate: c.end_date,
        status: c.status,
        invitationCode: c.invitation_code,
    })

    // Update classroom
    const { data: updatedClassroom, error: updateError } = (await (
        client.from('classrooms') as any
    )
        .update(updateData)
        .eq('id', classroomId)
        .select(selectQuery)
        .single()) as { data: any; error: any }

    if (updateError) {
        console.error('Database error:', updateError)
        throw createError({
            statusCode: 500,
            message: 'Failed to update classroom',
        })
    }

    return {
        success: true,
        message: 'Classroom updated successfully',
        classroom: mapClassroom(updatedClassroom),
    }
})
