import { serverSupabaseClient } from '#supabase/server'
import { Database } from '@/assets/types/supabase'

export default defineEventHandler(async (event) => {
  console.log('/api/instructors HIT')
  const supabase = await serverSupabaseClient<Database>(event)

  // Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Role check
  const { data: requester } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (requester?.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Admin only' })
  }

  // Fetch instructors + user + classroom
  const { data, error } = await supabase
    .from('instructors')
    .select(`
      status,
      user:users (
        id,
        name,
        email,
        school
      ),
      classrooms (
        id
      )
    `)

  console.log('instructors raw data:', data)
  console.log('instructors error:', error)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // Normalize for table
  return data.map((row) => ({
    id: row.user.id,
    name: row.user.name,
    email: row.user.email,
    school: row.user.school,
    classroom: row.classrooms?.[0]?.id ?? null,
    status: row.status,
  }))
})