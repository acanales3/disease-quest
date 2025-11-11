<template>
  <div class="w-full">
    <AssessmentCategoryScoreGraph
      :data="mockData"
      :index="index"
      :categories="categories"
    />
  </div>
</template>

<script setup lang="ts">
import AssessmentCategoryScoreGraph from '@/components/AssessmentCategoryScoreGraph/graph.vue'
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


