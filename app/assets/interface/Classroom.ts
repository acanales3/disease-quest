export interface Classroom {
  id: number;
  name: string;
  code: string;
  instructor: string;
  school: string;
  section: string;
  startDate: string;
  endDate: string;
  status: "active" | "inactive";
  invitationCode?: string | null;
}

// Used for when classrooms are retrieved intructor/student classroom editing
export interface ClassroomOptions {
  id: number;
  name: string;
}

export const classrooms: Classroom[] = [];