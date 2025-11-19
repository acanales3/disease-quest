<template>
  <div class="flex flex-col space-y-8 w-full mx-auto px-4 mb-16">
    <div class="flex flex-col items-center w-full">
      <h1 class="text-lg font-bold pt-12">Evaluation Agent</h1>
      <p class="text-md text-muted-foreground">Discuss with your evaluation agent.</p>
      <CaseTextArea />
    </div>
    <div class="w-full px-20">
        <ClassroomScores class="border shadow-md"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import CaseTextArea from '@/components/CaseTextArea/text-area.vue';

import ClassroomScores from '../../graph/ScoresByCategoryGraph.vue'
import type { CaseScore } from '@/components/AssessmentCategoryScoreGraph/types'

const mockData: CaseScore[] = [
  { case: 'Case 1', score: 85 },
  { case: 'Case 2', score: 90 },
  { case: 'Case 3', score: 75 },
  { case: 'Case 4', score: 95 },
  { case: 'Case 5', score: 80 },
  { case: 'Case 6', score: 75 },
  { case: 'Case 7', score: 95 },
  { case: 'Case 8', score: 80 },
  { case: 'Case 9', score: 95 },
  { case: 'Case 10', score: 80 },
  { case: 'Case 11', score: 75 },
  { case: 'Case 12', score: 95 },
  { case: 'Case 13', score: 80 },
]

const index: keyof CaseScore = 'case'
const categories: (keyof CaseScore)[] = ['score']



</script>

<style scoped></style>
