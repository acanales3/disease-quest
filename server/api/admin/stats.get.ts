import { serverSupabaseUser, serverSupabaseServiceRole, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)
    const client = await serverSupabaseClient(event)
    const serviceRole = serverSupabaseServiceRole(event)

    // authentication check
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        })
    }

    // @ts-ignore
    const userId = user.id || user.sub

    if (!userId) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized: User ID missing',
        })
    }

    // admin authorization check
    // Use serviceRole to check role to avoid RLS issues on the users table
    const { data: userProfile, error: profileError } = await serviceRole
        .from('users')
        .select('role')
        .eq('id', userId)
        .single() as { data: { role: string } | null, error: any }

    if (profileError || !userProfile || userProfile.role !== 'ADMIN') {
        // Detailed error for debugging (remove in production if needed)
        const msg = profileError ? `Error: ${profileError.message}` : `Role mismatch: ${userProfile?.role}`
        console.error('Admin Stats 403:', msg)

        throw createError({
            statusCode: 403,
            statusMessage: `Forbidden: Admin access required. ${msg}`,
        })
    }

    // fetch queries run in parallel with Promise.all
    // service role is used for counts to ensure we get global counts
    // userQuery uses 'client' to respect standard RLS/permissions for the user themselves.

    const [
        userData,
        studentsCount,
        instructorsCount,
        classroomsCount,
        casesCount
    ] = await Promise.all([
        // Fetch User Name (admin name)
        client
            .from('users')
            .select('name')
            .eq('id', userId)
            .single(),

        // Count Students
        serviceRole
            .from('students')
            .select('*', { count: 'exact', head: true }),

        // Count Instructors
        serviceRole
            .from('instructors')
            .select('*', { count: 'exact', head: true }),

        // Count Classrooms
        serviceRole
            .from('classrooms')
            .select('*', { count: 'exact', head: true }),

        // Count Cases
        serviceRole
            .from('cases')
            .select('*', { count: 'exact', head: true })
    ])

    // error checking
    if (userData.error) {
        console.error('Error fetching admin user name:', userData.error)
    }
    if (studentsCount.error) console.error('Error counting students:', studentsCount.error)
    if (instructorsCount.error) console.error('Error counting instructors:', instructorsCount.error)
    if (classroomsCount.error) console.error('Error counting classrooms:', classroomsCount.error)
    if (casesCount.error) console.error('Error counting cases:', casesCount.error)

    return {
        user: {
            name: (userData.data as any)?.name || 'Admin',
        },
        counts: {
            students: studentsCount.count ?? 0,
            instructors: instructorsCount.count ?? 0,
            classrooms: classroomsCount.count ?? 0,
            cases: casesCount.count ?? 0,
        }
    }
})
