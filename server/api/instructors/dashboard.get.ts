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
        .select(`
            first_name,
            last_name
            `)
        .eq('id', instructorId)
        .single()

    const name = userRow?.first_name + ' ' + userRow?.last_name;
    
    // Get number of students
    const { count: studentCount, error: studentError } = await supabase
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
    const { count: classroomCount, error: classroomError } = await supabase
        .from('classrooms')
        .select('*', {count: 'exact', head: true})
        .eq('instructor_id', instructorId)
        .eq('status', 'active')

    if (classroomError) throw createError({ statusCode: 500, statusMessage: classroomError.message })

    // Number of cases available in instructor's classes.
    const { count: casesAvailable, error: caseError } = await supabase
        .from('classroom_cases')
        .select(`
            classroom_id,
            classrooms!inner (
                instructor_id,
                status
            )    
        `, { count: 'exact', head: true })
        .eq('classrooms.instructor_id', instructorId)
        .eq('classrooms.status', 'active')

    if (caseError) throw createError({ statusCode: 500, statusMessage: caseError.message })

    const { count: registered } = await supabase
        .from('invitations')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', instructorId)
        .eq('role', 'STUDENT')
        .eq('status', 'accepted')

    const { count: unregistered } = await supabase
        .from('invitations')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', instructorId)
        .eq('role', 'STUDENT')
        .eq('status', 'pending')

    const totalInvites = (registered ?? 0) + (unregistered ?? 0);
    return {
        instructorName: name,
        totalStudents: studentCount ?? 0,
        totalClassrooms: classroomCount ?? 0,
        totalCases: casesAvailable ?? 0,
        registeredStudents: registered ?? 0,
        unregisteredStudents: unregistered ?? 0,
        totalInvitations: totalInvites
    };
    
})