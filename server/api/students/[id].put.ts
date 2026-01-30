import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)
    const client = await serverSupabaseClient(event)

    if (!user) {
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
        .eq('id', user.id)
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

    return { success: true }
})
