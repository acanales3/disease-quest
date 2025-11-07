<template>
  <div class="p-2">
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
]

const index: keyof CaseScore = 'case'
const categories: (keyof CaseScore)[] = ['score']
</script>


