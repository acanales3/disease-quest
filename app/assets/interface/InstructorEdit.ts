export interface InstructorEdit {
  id: string,
  first_name: string,
  last_name: string,
  email: string,
  school: string,
  classroom: number | null,
  status: 'active' | 'deactivated'
}