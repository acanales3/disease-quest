<template>
  <div class="w-full flex flex-col gap-8">
    <div class="border-b border-gray-200 pb-8">
      <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p class="text-xs font-medium text-[#4d1979] uppercase tracking-widest mb-2">Insights</p>
          <h1 class="text-3xl font-semibold text-gray-900 tracking-tight leading-snug">Analytics</h1>
          <p class="text-gray-500 text-[15px] mt-2">
            View assessment scores by category, case, and classroom.
          </p>
          <div class="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#4d1979]">
            <Icon name="uim:analytics" size="15" class="text-white" />
            <span class="text-[13px] font-medium text-white">{{ analyticsData.length }} score records</span>
          </div>
        </div>

        <div class="sm:min-w-[360px] rounded-xl border border-[#4a2c6f] bg-gradient-to-r from-[#5f2a96] to-[#3f2463] px-4 py-3">
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

    <div v-if="pending" class="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
      Loading analytics...
    </div>

    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
      Failed to load analytics.
    </div>

    <template v-else>
      <ClassroomScores
        class="mb-8"
        :data="analyticsData"
      />

      <AssessmentCategoryScoreGraph
        :data="analyticsData"
      />
    </template>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ClassroomScores from '../../graph/ScoresByCategoryGraph.vue'
import AssessmentCategoryScoreGraph from '@/components/AssessmentCategoryScoreGraph/graph.vue'
import type { AnalyticsScoreEntry } from '@/types/analytics'

/**
 * Fetch analytics
 * API automatically filters based on role:
 * - INSTRUCTOR → their classrooms only
 * - STUDENT → their work
 * - ADMIN → everything
 */
const { data, pending, error } = await useFetch<AnalyticsScoreEntry[]>(
  '/api/analytics/scores',
  {
    server: true,
    credentials: 'include'
  }
)

/**
 * Ensure charts always receive an array
 */
const analyticsData = computed<AnalyticsScoreEntry[]>(() => {
  return data.value ?? []
})

const uniqueCaseCount = computed(() => {
  return new Set(analyticsData.value.map((entry) => entry.caseId)).size
})

const uniqueClassroomCount = computed(() => {
  return new Set(analyticsData.value.map((entry) => entry.classroomId)).size
})

const overallAverage = computed(() => {
  if (!analyticsData.value.length) return 0

  const weightedTotal = analyticsData.value.reduce((sum, entry) => {
    const categoryAverage =
      (
        entry.history_taking_synthesis +
        entry.physical_exam_interpretation +
        entry.differential_diagnosis_formulation +
        entry.diagnostic_tests +
        entry.management_reasoning +
        entry.communication_empathy +
        entry.reflection_metacognition
      ) / 7

    return sum + categoryAverage * entry.count
  }, 0)

  const totalCount = analyticsData.value.reduce((sum, entry) => sum + entry.count, 0)
  if (!totalCount) return 0

  return Math.round((weightedTotal / totalCount) * 10) / 10
})
</script>