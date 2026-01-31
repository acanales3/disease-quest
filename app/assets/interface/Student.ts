interface Student {
  id: number;
  name: string;
  nickname: string;
  email: string;
  school: string;
  msyear: number;
  classroom: number;
  status: "registered" | "unregistered";
}

export const student: Student[] = [];