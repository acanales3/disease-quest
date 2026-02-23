<template>
    <div class="flex flex-col justify-start gap-4 w-full">
        <!-- Greeting Card -->
        <div class="rounded-lg text-center flex flex-col items-center justify-center w-full bg-white shadow-sm py-6">
            <h1 class="text-lg font-bold text-gray-800">Hey {{ user.name }}!</h1>
            <p class="text-sm text-gray-500">Welcome back to DiseaseQuest!</p>
        </div>

        <!-- Stats Row -->
        <div class="flex justify-between gap-4">
            <TotalCount icon="mdi:check-circle" :count="`${stats?.completedPercent ?? 0}%`" label="Cases completed" />
            <TotalCount icon="mdi:clock-outline" :count="stats?.inProgress ?? 0" label="Cases in progress" />
            <TotalCount icon="mdi:circle-outline" :count="`${stats?.notStartedPercent ?? 0}%`" label="Cases not started" />
            <TotalCount icon="mdi:fire" :count="stats?.login_streak ?? 0" label="Login Streak" />
        </div>

        
    </div>
</template>

<script setup lang="ts">
import type { Case } from '../../CaseDatatable/columns'
import TotalCount from '@/components/ui/TotalCount.vue'
import { computed } from 'vue'

type DashboardResponse = {
    user: { name: string | null}
    stats: any | null
    cases: Case[]
}

const { data, pending, error } = await useFetch<DashboardResponse>(
    '/api/students/dashboard'
)

// Example user - replace with api data
const user = computed(() => ({
    name: data.value?.user.name ?? 'Student'
}))

const stats = computed(() => data.value?.stats)

const caseData = computed(() => data.value?.cases ?? [])


</script>
