interface Student {
  id: number;
  userId?: string;
  name: string;
  nickname: string;
  email: string;
  school: string;
  msyear: number;
  classroom: number;
  status: "registered" | "unregistered";
}

export const student: Student[] = [];