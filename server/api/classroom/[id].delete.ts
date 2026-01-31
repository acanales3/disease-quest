import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Classroom ID is required',
    })
  }

  const classroomId = parseInt(id, 10)

  if (isNaN(classroomId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid classroom ID format',
    })
  }

  // Use 'any' to bypass Supabase strict table type constraints
  const supabase = await serverSupabaseClient(event) as any

  // First, check if the classroom exists
  const { data: classroom, error: fetchError } = await supabase
    .from('classrooms')
    .select('id, name')
    .eq('id', classroomId)
    .single()

  if (fetchError || !classroom) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Classroom not found',
    })
  }

  // Delete related records in order (due to foreign key constraints)
  
  // 1. Delete leaderboard entries for leaderboards in this classroom
  const { data: leaderboards } = await supabase
    .from('leaderboards')
    .select('id')
    .eq('classroom_id', classroomId)

  if (leaderboards && leaderboards.length > 0) {
    const leaderboardIds = leaderboards.map((l: { id: number }) => l.id)
    
    const { error: leaderboardEntriesError } = await supabase
      .from('leaderboard_entries')
      .delete()
      .in('leaderboard_id', leaderboardIds)

    if (leaderboardEntriesError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete leaderboard entries',
      })
    }
  }

  // 2. Delete leaderboards associated with this classroom
  const { error: leaderboardsError } = await supabase
    .from('leaderboards')
    .delete()
    .eq('classroom_id', classroomId)

  if (leaderboardsError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete leaderboards',
    })
  }

  // 3. Delete evaluations for cases in this classroom
  const { data: cases } = await supabase
    .from('cases')
    .select('id')
    .eq('classroom_id', classroomId)

  if (cases && cases.length > 0) {
    const caseIds = cases.map((c: { id: number }) => c.id)

    // Delete student_cases entries
    const { error: studentCasesError } = await supabase
      .from('student_cases')
      .delete()
      .in('case_id', caseIds)

    if (studentCasesError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete student case assignments',
      })
    }

    // Delete evaluations
    const { error: evaluationsError } = await supabase
      .from('evaluations')
      .delete()
      .in('case_id', caseIds)

    if (evaluationsError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete evaluations',
      })
    }
  }

  // 4. Delete cases associated with this classroom
  const { error: casesError } = await supabase
    .from('cases')
    .delete()
    .eq('classroom_id', classroomId)

  if (casesError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete cases',
    })
  }

  // 5. Delete classroom_students associations
  const { error: classroomStudentsError } = await supabase
    .from('classroom_students')
    .delete()
    .eq('classroom_id', classroomId)

  if (classroomStudentsError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete classroom student associations',
    })
  }

  // 6. Finally, delete the classroom itself
  const { error: deleteError } = await supabase
    .from('classrooms')
    .delete()
    .eq('id', classroomId)

  if (deleteError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete classroom',
    })
  }

  return {
    success: true,
    message: `Classroom "${classroom.name}" has been successfully deleted`,
    deletedId: classroomId,
  }
})
