export interface LeaderboardEntry {
  id: number;
  studentId: string;
  classroomName: string;
  nickname: string;
  casesCompleted: number;
  averageScore: number;
  rank: number;
  studentName?: string;
}

export const leaderboard: LeaderboardEntry[] = [
  {
    id: 1,
    studentId: "student-uuid-1",
    classroomName: "Classroom A",
    nickname: "Dr. House",
    casesCompleted: 5,
    averageScore: 95,
    rank: 1,
  },
  {
    id: 2,
    studentId: "student-uuid-2",
    classroomName: "Classroom A",
    nickname: "Doogie",
    casesCompleted: 4,
    averageScore: 88,
    rank: 2,
  },
  {
    id: 3,
    studentId: "student-uuid-3",
    classroomName: "Classroom B",
    nickname: "JD",
    casesCompleted: 3,
    averageScore: 92,
    rank: 3,
  },
];