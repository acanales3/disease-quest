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

export const leaderboard: LeaderboardEntry[] = [];