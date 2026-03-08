export interface AnalyticsScoreEntry {
  // Identity
  evaluationId: number;
  sessionId: string | null;
  caseId: number;
  caseName: string;
  classroomId: number;
  classroomName: string;

  // Attempt tracking
  attemptNumber: number;
  completedAt: string | null; // ISO timestamp — used to sort attempts chronologically

  // Aggregation (always 1 for per-attempt rows; kept for weighted-avg compatibility)
  count: number;

  // Scores (stored as 0–100 integers, matching existing API output)
  history_taking_synthesis: number;
  physical_exam_interpretation: number;
  differential_diagnosis_formulation: number;
  diagnostic_tests: number;
  management_reasoning: number;
  communication_empathy: number;
  reflection_metacognition: number;
}
