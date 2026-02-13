import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '@/assets/types/supabase'

export default defineEventHandler(async (event) => {
    const supabase = await serverSupabaseClient<Database>(event);
    const { data: { user } } = await supabase.auth.getUser(); 

    if (!user) {
        throw createError({ statusCode: 400, statusMessage: 'Instructor ID required'});
    }

    const instructorId = user.id;

    // User name
    const { data: userRow } = await supabase
        .from('users')
        .select('name')
        .eq('id', instructorId)
        .single()
    
    // Get number of students
    const { data: studentCount, error: studentError } = await supabase
        .from('classroom_students')
        .select(`
            classroom_id,
            classrooms!inner (
                instructor_id,
                status
            )   
        `, { count: 'exact', head: true })
        .eq('classrooms.instructor_id', instructorId)
        .eq('classrooms.status', 'active')

    if (studentError) throw createError({ statusCode: 500, statusMessage: studentError.message })

    // Get number of classes user is instructing
    const { data: classroomCount, error: classroomError } = await supabase
        .from('classrooms')
        .select('*', {count: 'exact', head: true})
        .eq('instructor_id', instructorId)
        .eq('status', 'active')

    if (classroomError) throw createError({ statusCode: 500, statusMessage: classroomError.message })

    // Number of cases available in instructor's classes.
    const { data: casesAvailable, error: caseError } = await supabase
        .from('classroom_cases')
        .select(`
            classroom_id,
            classrooms!inner (
                instructor_id,
                status
            )    
        `, { count: 'exact', head: true })
        .eq('instructor_id', instructorId)
        .eq('status', 'active')

    if (caseError) throw createError({ statusCode: 500, statusMessage: caseError.message })

    // Total invites
    const { data: totalInvites, error: inviteError } = await supabase
        .from('invitations')
        .select(`
            classroom_id,
            classrooms!inner (
                instructor_id
            )    
        `, { count: 'exact', head: true })
        .eq('classrooms.instructor_id', instructorId)

    if (inviteError) createError({ statusCode: 500, statusMessage: inviteError.message })

    // Total registered students
    const { data: registeredStudents, error: regError } = await supabase
            .from('invitations')
            .select(`
                classroom_id,
                classrooms!inner(
                    instructor_id
                )
            `, { count: 'exact', head: true })
            .eq('classrooms.instructor_id', instructorId)
            .eq('status', 'accepted')

    if (regError) createError ({ statusCode: 500, statusMessage: regError.message})

    return;
    
})