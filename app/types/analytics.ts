export interface AnalyticsScoreEntry {
    caseId: number;
    caseName: string;
    classroomId: number;
    classroomName: string;
    count: number;
    history_taking_synthesis: number;
    physical_exam_interpretation: number;
    differential_diagnosis_formulation: number;
    diagnostic_tests: number;
    management_reasoning: number;
    communication_empathy: number;
    reflection_metacognition: number;
}
