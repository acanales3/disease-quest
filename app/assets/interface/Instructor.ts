import type { Classroom, ClassroomOptions } from '@/assets/interface/Classroom'

export interface Instructor {
  id: string;
  name: string;
  email: string;
  school: string;
  classrooms: ClassroomOptions[];
  status: "active" | "deactivated";
  // action column still needed
}
