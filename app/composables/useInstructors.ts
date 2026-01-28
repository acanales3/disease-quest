import { useSupabaseClient } from '#imports'
import type { Database, TablesUpdate, Tables } from '../assets/types/supabase'

type UserUpdate = TablesUpdate<'users'>;
type InstructorUpdate = TablesUpdate<'instructors'>;

export function useInstructors() {
  const supabase = useSupabaseClient<Database>()

  /**
   * Update instructor by ID
   */
  const updateInstructor = async (
    userId: string, // UUID
    data: {
      name: string
      email: string
      school: string
      status: 'active' | 'deactivated'
    }
  ) => {
    // Update user profile
    const { error: userError } = await supabase
      .from('users')
      .update({
        name: data.name,
        email: data.email,
        school: data.school,
      } satisfies UserUpdate)
      .eq('id', userId)

    if (userError) throw userError

    // Update instructor fields
    const { error: instructorError } = await supabase
      .from('instructors')
      .update({
        status: data.status,
      } satisfies InstructorUpdate)
      .eq('user_id', userId)

    if (instructorError) throw instructorError
  }
  
  return {
    updateInstructor,
  }

}
