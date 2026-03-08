export interface CaseAttemptDetail {
  caseId: number;
  caseName: string;
  attempts: number;
}

export interface LeaderboardEntry {
  id: number;
  studentId: string;
  classroomName: string;
  nickname: string;
  casesCompleted: number;
  attemptsCompleted: number;
  averageScore: number;
  rank: number;
  studentName?: string;
  caseDetails?: CaseAttemptDetail[]; // per-case breakdown for hover tooltips
}

export const leaderboard: LeaderboardEntry[] = [];
