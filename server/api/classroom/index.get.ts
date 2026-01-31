import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Use 'any' to bypass Supabase strict table type constraints
  const supabase = await serverSupabaseClient(event) as any

  // Fetch classrooms with instructor information
  const { data: classrooms, error } = await supabase
    .from('classrooms')
    .select(`
      id,
      name,
      code,
      school,
      section,
      start_date,
      end_date,
      status,
      instructor_id,
      instructors!inner (
        user_id,
        users!inner (
          first_name,
          last_name
        )
      )
    `)
    .order('id', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch classrooms',
    })
  }

  // Transform the data to match the frontend Classroom interface
  const transformedClassrooms = classrooms.map((classroom: any) => ({
    id: classroom.id,
    name: classroom.name,
    code: classroom.code,
    instructor: classroom.instructors?.users 
      ? `${classroom.instructors.users.first_name || ''} ${classroom.instructors.users.last_name || ''}`.trim() 
      : 'Unknown',
    school: classroom.school || '',
    section: classroom.section || '',
    startDate: classroom.start_date || '',
    endDate: classroom.end_date || '',
    status: classroom.status || 'active',
  }))

  return transformedClassrooms
})
