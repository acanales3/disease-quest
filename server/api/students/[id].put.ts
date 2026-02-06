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

    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Student ID is required',
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
    const isAdmin = role === 'ADMIN'

    if (!isAdmin) {
        throw createError({
            statusCode: 403,
            message: 'Forbidden: access denied',
        })
    }

    // update users table
    const { error: userUpdateError } = await client
        .from('users')
        // @ts-ignore
        .update({
            name: body.name,
            email: body.email,
            school: body.school
        } as any)
        .eq('id', id)

    if (userUpdateError) {
        throw createError({
            statusCode: 500,
            message: `Error updating user: ${userUpdateError.message}`,
        })
    }

    // update students table
    const { error: studentUpdateError } = await client
        .from('students')
        // @ts-ignore
        .update({
            nickname: body.nickname,
            msyear: body.msyear,
            status: body.status
        } as any)
        .eq('user_id', id)

    if (studentUpdateError) {
        throw createError({
            statusCode: 500,
            message: `Error updating student details: ${studentUpdateError.message}`,
        })
    }

    // update classroom if provided
    // We assume a student can only be in one classroom at a time based on the UI logic (single classroom input)
    if (typeof body.classroom !== 'undefined') {
        const classroomId = Number(body.classroom)

        // First, remove existing classroom associations
        const { error: deleteError } = await client
            .from('classroom_students')
            .delete()
            .eq('student_id', id)

        if (deleteError) {
            throw createError({
                statusCode: 500,
                message: `Error removing student from previous classroom: ${deleteError.message}`,
            })
        }

        // try to add the new association
        if (classroomId >= 0) {
            const { error: insertError } = await client
                .from('classroom_students')
                // @ts-ignore
                .insert({
                    classroom_id: classroomId,
                    student_id: id
                } as any)

            if (insertError) {
                throw createError({
                    statusCode: 500,
                    message: `Error assigning student to classroom ${classroomId}: ${insertError.message}`,
                })
            }
        }
    }

    return { success: true }
})
