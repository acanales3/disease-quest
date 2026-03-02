<template>
  <div class="w-full max-w-6xl mx-auto flex flex-col gap-8">
    <div class="border-b border-gray-200 pb-8">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="text-xs font-medium text-[#4d1979] uppercase tracking-widest mb-2">Insights</p>
          <h1 class="text-3xl font-semibold text-gray-900 tracking-tight">Analytics</h1>
          <p class="text-gray-500 text-[15px] mt-2">
            Review your performance trends across cases and assessment categories.
          </p>
          <div class="mt-3 flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 bg-gray-700 text-white text-xs font-medium px-3 py-1 rounded-full">
              <Icon name="lucide:bar-chart-3" size="11" />
              {{ analyticsData.length }} score records
            </span>
          </div>
        </div>
        <div class="sm:min-w-[460px] bg-gradient-to-r from-[#5f2a96] to-[#34204f] border border-[#4a2c6f] rounded-xl px-4 py-3">
          <p class="text-[11px] font-medium uppercase tracking-wider text-white/80">Performance Snapshot</p>
          <div class="mt-3 grid grid-cols-3 divide-x divide-white/20">
            <div class="pr-3">
              <p class="text-[10px] uppercase tracking-wider text-white/70">Average Score</p>
              <p class="mt-1 text-[22px] font-semibold text-white tabular-nums leading-none">{{ overallAverage }}%</p>
            </div>
            <div class="px-3">
              <p class="text-[10px] uppercase tracking-wider text-white/70">Cases</p>
              <p class="mt-1 text-[22px] font-semibold text-white tabular-nums leading-none">{{ uniqueCaseCount }}</p>
            </div>
            <div class="pl-3">
              <p class="text-[10px] uppercase tracking-wider text-white/70">Classrooms</p>
              <p class="mt-1 text-[22px] font-semibold text-white tabular-nums leading-none">{{ uniqueClassroomCount }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not logged in -->
    <div v-if="!user" class="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
      Please log in to view your analytics.
    </div>

    <!-- Loading -->
    <div v-else-if="pending" class="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
      Loading your analytics...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-600">
      Failed to load analytics.
    </div>

    <!-- Charts -->
    <template v-else>
      <ClassroomScores :data="analyticsData" />
      <AssessmentCategoryScoreGraph :data="analyticsData" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ClassroomScores from '../../graph/ScoresByCategoryGraph.vue'
import AssessmentCategoryScoreGraph from '@/components/AssessmentCategoryScoreGraph/graph.vue'
import type { AnalyticsScoreEntry } from '@/types/analytics'
import { Icon } from '#components'

/**
 * Supabase user session
 */
const user = useSupabaseUser()

/**
 * Fetch analytics
 * API automatically filters:
 * - STUDENT → only their evaluations
 */
const { data, pending, error } = await useFetch<AnalyticsScoreEntry[]>(
  '/api/analytics/scores',
  {
    server: true,
    credentials: 'include',
    watch: [user] // refetch if user changes
  }
)

/**
 * Ensure charts always receive an array
 */
const analyticsData = computed<AnalyticsScoreEntry[]>(() => {
  return data.value ?? []
})

const uniqueCaseCount = computed(() => {
  return new Set(analyticsData.value.map((d) => d.caseId)).size
})

const uniqueClassroomCount = computed(() => {
  return new Set(analyticsData.value.map((d) => d.classroomId)).size
})

const overallAverage = computed(() => {
  if (!analyticsData.value.length) return 0
  const fields: (keyof AnalyticsScoreEntry)[] = [
    'history_taking_synthesis',
    'physical_exam_interpretation',
    'differential_diagnosis_formulation',
    'diagnostic_tests',
    'management_reasoning',
    'communication_empathy',
    'reflection_metacognition',
  ]

  let totalWeight = 0
  let weightedSum = 0

  analyticsData.value.forEach((row) => {
    const rowAvg =
      fields.reduce((sum, key) => sum + Number(row[key] || 0), 0) / fields.length
    weightedSum += rowAvg * row.count
    totalWeight += row.count
  })

  return totalWeight ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0
})
</script>