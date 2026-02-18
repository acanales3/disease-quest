import { serverSupabaseClient, serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/assets/types/supabase'
import type { LeaderboardEntry } from '~/assets/interface/Leaderboard'

export default defineEventHandler(async (event): Promise<LeaderboardEntry[]> => {
    // Use service role to bypass RLS
    const client = serverSupabaseServiceRole<Database>(event)
    const user = await serverSupabaseUser(event)

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        })
    }

    // @ts-ignore
    const userId = user.id || user.sub;


    // Get current user's role
    const { data: userData } = await client
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

    const userRole = userData?.role
    const isAdmin = userRole === 'ADMIN'
    const isInstructor = userRole === 'INSTRUCTOR'
    const isStudent = userRole === 'STUDENT'

    // Get query params for filtering
    const query = getQuery(event)
    const classroomId = query.classroomId ? Number(query.classroomId) : undefined

    // Determine allowed classrooms based on role
    let allowedClassroomIds: number[] = []

    if (isInstructor) {
        const { data: classrooms } = await client
            .from('classrooms')
            .select('id')
            .eq('instructor_id', userId)

        if (classrooms) {
            allowedClassroomIds = classrooms.map(c => c.id)
        }
    } else if (isStudent) {
        const { data: classrooms } = await client
            .from('classroom_students')
            .select('classroom_id')
            .eq('student_id', userId)

        if (classrooms) {
            allowedClassroomIds = classrooms.map(c => c.classroom_id)
        }
    }

    // Base query on leaderboard_view
    let dbQuery = client
        .from('leaderboard_view')
        .select(`
      rank,
      cases_completed,
      average_score,
      student_id,
      leaderboard_id,
      students!inner(
        nickname,
        users(name, first_name, last_name)
      ),
      leaderboards!inner(
        classroom_id,
        classrooms(name)
      )
    `)

    // Apply Role-Based Scoping
    if (!isAdmin) {
        if (allowedClassroomIds.length === 0 && !isInstructor && !isStudent) {
            // If user has no classrooms and is not admin, they might not see anything unless logic permits.
            // But if they are instructor/student with 0 classes, the arrays are 0 length.
            // If we want to return [] for non-admin with no classes:
            return []
        }

        // Update: check length of allowed IDs.
        if (allowedClassroomIds.length === 0) {
            console.log('[API] No allowed classrooms for non-admin user.');
            return []
        }
        dbQuery = dbQuery.in('leaderboards.classroom_id', allowedClassroomIds)
    }

    // Apply specific classroom filter if provided
    if (classroomId && classroomId !== -1) {
        dbQuery = dbQuery.eq('leaderboards.classroom_id', classroomId)
    }

    // Sort by rank
    dbQuery = dbQuery.order('rank', { ascending: true })

    const { data, error } = await dbQuery

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        })
    }

    if (!data || data.length === 0) {
        return []
    }

    // Map to LeaderboardEntry interface
    return data.map((row: any) => {
        // Construct student name if admin
        let studentName = undefined
        if (isAdmin && row.students?.users) {
            const u = row.students.users
            studentName = u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown'
        }

        return {
            id: row.leaderboard_id,
            studentId: row.student_id,
            classroomName: row.leaderboards?.classrooms?.name || 'Unknown',
            nickname: row.students?.nickname || 'Anonymous',
            casesCompleted: row.cases_completed || 0,
            averageScore: row.average_score || 0,
            rank: row.rank || 0,
            studentName: studentName
        } as LeaderboardEntry
    })
})
