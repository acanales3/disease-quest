<template>
    <div class="w-full">
        <ClassroomScores class="mb-8" :data="mockData"/>
        <AssessmentCategoryScoreGraph
        :data="mockData"
        /> 
    </div>
</template>

<script setup lang="ts">
import ClassroomScores from '../../graph/ScoresByCategoryGraph.vue'
import AssessmentCategoryScoreGraph from '@/components/AssessmentCategoryScoreGraph/graph.vue'
import type { AnalyticsScoreEntry } from '@/types/analytics'

// Mock Data for Verification (matches new Interface)
const mockData: AnalyticsScoreEntry[] = [
    {
        caseId: 1, caseName: 'Case A',
        classroomId: 101, classroomName: 'Section 1',
        count: 10,
        history_taking_synthesis: 85,
        physical_exam_interpretation: 90,
        differential_diagnosis_formulation: 88,
        diagnostic_tests: 92,
        management_reasoning: 85,
        communication_empathy: 95,
        reflection_metacognition: 89
    },
    {
        caseId: 2, caseName: 'Case B',
        classroomId: 101, classroomName: 'Section 1',
        count: 12,
        history_taking_synthesis: 78,
        physical_exam_interpretation: 82,
        differential_diagnosis_formulation: 80,
        diagnostic_tests: 85,
        management_reasoning: 79,
        communication_empathy: 88,
        reflection_metacognition: 84
    },
    {
        caseId: 1, caseName: 'Case A',
        classroomId: 102, classroomName: 'Section 2',
        count: 8,
        history_taking_synthesis: 92,
        physical_exam_interpretation: 88,
        differential_diagnosis_formulation: 94,
        diagnostic_tests: 90,
        management_reasoning: 93,
        communication_empathy: 91,
        reflection_metacognition: 95
    }
]
</script>
