export interface LeaderboardEntry {
  id: number;
  studentId: number;
  classroomId: number;
  nickname: string;
  score: number;
  position?: number;
  studentName?: string;
}

export const leaderboard: LeaderboardEntry[] = []