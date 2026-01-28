import { useSupabaseClient } from '#imports';
import type { TablesUpdate, Database } from '../assets/types/supabase'

type ClassroomUpdate = TablesUpdate<'classrooms'>;

export const useClassroms = () => {
  const supabase = useSupabaseClient<Database>()

  const assignInstructor = async (
    classroomId: number,
    instructorUserId: string
  ) => {
    const { error } = await supabase
      .from('classrooms')
      .update({
        instructor_id: instructorUserId,
      } satisfies ClassroomUpdate)
      .eq('id', classroomId)

      if (error) throw error;
  }

  return {
    assignInstructor
  }
}