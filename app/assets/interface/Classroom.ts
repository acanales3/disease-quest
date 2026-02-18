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

export const classrooms: Classroom[] = [];