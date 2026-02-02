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

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Student ID is required',
        })
    }

    // Fetch requester profile for role check
    const { data: userProfile, error: profileError } = (await client
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()) as { data: { role: string } | null; error: any }

    if (profileError || !userProfile) {
        throw createError({
            statusCode: 403,
            message: 'Forbidden: User profile not found',
        })
    }

    if (userProfile.role?.toUpperCase() !== 'ADMIN') {
        throw createError({
            statusCode: 403,
            message: 'Forbidden: access denied',
        })
    }

    const { error: deleteError } = await client
        .from('users')
        .delete()
        .eq('id', id)

    if (deleteError) {
        throw createError({
            statusCode: 500,
            message: `Error deleting student: ${deleteError.message}`,
        })
    }

    return {
        success: true,
        message: `Student ${id} and all associated evaluations were permanently deleted.`,
    }
})
