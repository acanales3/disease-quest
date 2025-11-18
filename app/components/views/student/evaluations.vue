<template>
    <div class="flex flex-col justify-start gap-4 w-full">
        <!-- Greeting Card -->
        <div
            class="rounded-lg text-center flex flex-col items-center justify-center w-full bg-white shadow-sm py-6"
        >
            <h1 class="text-lg font-bold text-gray-800">Your Evaluations</h1>
            <p class="text-sm text-gray-500">
                Track your assessment results and feedback
            </p>
        </div>

        <!-- Stats Row -->
        <div class="flex justify-between gap-4">
            <TotalCount
                icon="mdi:star"
                :count="`${averageScore}%`"
                label="Average Score"
            />
            <TotalCount
                icon="mdi:check-circle"
                :count="evaluationData.length"
                label="Total Evaluations"
            />
            <TotalCount
                icon="mdi:trending-up"
                :count="`${highestScore}%`"
                label="Highest Score"
            />
            <TotalCount
                icon="mdi:calendar"
                :count="latestEvaluation"
                label="Latest Evaluation"
            />
        </div>

        <!-- Error State -->
        <div
            v-if="error"
            class="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-3"
        >
            <Icon name="mdi:alert-circle" size="24" class="text-red-500" />
            <div>
                <p class="font-semibold text-red-800">
                    Error Loading Evaluations
                </p>
                <p class="text-sm text-red-600">{{ error }}</p>
            </div>
        </div>

        <!-- Empty State -->
        <div
            v-else-if="evaluationData.length === 0"
            class="rounded-lg bg-blue-50 border border-blue-200 p-8 flex flex-col items-center justify-center"
        >
            <Icon
                name="mdi:inbox-outline"
                size="48"
                class="text-blue-400 mb-3"
            />
            <p class="font-semibold text-blue-800">No Evaluations Yet</p>
            <p class="text-sm text-blue-600">
                Complete assignments and activities to see your evaluations here
            </p>
        </div>

        <!-- Evaluations List -->
        <div v-else class="flex flex-col gap-4">
            <div
                v-for="evaluation in evaluationData"
                :key="evaluation.id"
                class="rounded-lg bg-white shadow-sm p-4 hover:shadow-md transition-shadow"
            >
                <div class="flex items-start justify-between gap-4">
                    <!-- Left: Activity Info -->
                    <div class="flex-1 min-w-0">
                        <h3 class="font-semibold text-gray-800 mb-1">
                            {{ evaluation.activityName }}
                        </h3>
                        <p class="text-sm text-gray-500 mb-3">
                            {{ formatDate(evaluation.date) }}
                        </p>
                        <p class="text-sm text-gray-700">
                            {{ evaluation.feedback }}
                        </p>
                    </div>

                    <!-- Right: Score Badge -->
                    <div
                        :class="`flex items-center justify-center w-16 h-16 rounded-lg font-bold text-lg shrink-0 ${getScoreBadgeColor(
                            evaluation.score
                        )}`"
                    >
                        {{ evaluation.score }}%
                    </div>
                </div>
            </div>
        </div>

        <!-- Cumulative Progress Section -->
        <div
            v-if="evaluationData.length > 0"
            class="rounded-lg bg-white shadow-sm p-6"
        >
            <h2 class="font-semibold text-gray-800 mb-4">
                Cumulative Progress
            </h2>
            <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                    :style="{ width: `${averageScore}%` }"
                    class="bg-linear-to-r from-blue-500 to-purple-500 h-full transition-all duration-500"
                ></div>
            </div>
            <div class="flex justify-between mt-3">
                <span class="text-sm text-gray-600">Progress</span>
                <span class="text-sm font-semibold text-gray-800"
                    >{{ averageScore }}% Complete</span
                >
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { evaluations } from '~/assets/interface/Evaluation'
import type { Evaluation } from '~/assets/interface/Evaluation'
import TotalCount from '@/components/ui/TotalCount.vue'
import { onMounted, ref, computed } from 'vue'

const evaluationData = ref<Evaluation[]>([])
const error = ref<string | null>(null)

const averageScore = computed(() => {
    if (evaluationData.value.length === 0) return 0
    const sum = evaluationData.value.reduce(
        (acc, evaluation) => acc + evaluation.score,
        0
    )
    return Math.round(sum / evaluationData.value.length)
})

const highestScore = computed(() => {
    if (evaluationData.value.length === 0) return 0
    return Math.max(
        ...evaluationData.value.map((evaluation) => evaluation.score)
    )
})

const latestEvaluation = computed(() => {
    if (evaluationData.value.length === 0) return 'N/A'
    const firstEval = evaluationData.value[0]
    if (!firstEval) return 'N/A'
    const latest = new Date(firstEval.date)
    return latest.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    })
})

function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

function getScoreBadgeColor(score: number): string {
    if (score >= 90) return 'bg-green-100 text-green-700'
    if (score >= 80) return 'bg-blue-100 text-blue-700'
    if (score >= 70) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
}

onMounted(async () => {
    try {
        // fetch API
        evaluationData.value = evaluations.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
    } catch (err) {
        error.value = 'Failed to load evaluations. Please try again later.'
    }
})
</script>
