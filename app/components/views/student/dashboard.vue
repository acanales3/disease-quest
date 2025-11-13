<template>
    <div class="w-full max-w-7xl mx-auto px-4">
        <!-- Greeting Card -->
        <div
            class="rounded-lg flex flex-col items-center text-center justify-center w-full bg-white shadow-sm py-6 px-6 mb-6"
        >
            <h1 class="text-2xl font-bold text-gray-800">
                Hey {{ user.name }}!
            </h1>
            <p class="text-sm text-gray-500 mt-2">
                Welcome back to DiseaseQuest!
            </p>
        </div>

        <!-- Stats Row -->
        <div class="flex w-full justify-between items-center gap-4 my-6">
            <TotalCount
                icon="mdi:check-circle"
                count="80%"
                label="Cases completed"
            />

            <TotalCount
                icon="mdi:clock-outline"
                count="258+"
                label="Cases in progress"
            />

            <TotalCount
                icon="mdi:circle-outline"
                count="64%"
                label="Cases not started"
            />

            <TotalCount icon="mdi:fire" count="245" label="Day Streak" />
        </div>

        <!-- Attempted Cases Table -->
        <div class="mt-8">
            <DataTable :columns="columns" :data="caseData" :row-length="5" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { columns } from '../../CaseDatatable/columns'
import DataTable from '../../CaseDatatable/data-table.vue'
import type { Case } from '../../CaseDatatable/columns'
import TotalCount from '@/components/ui/TotalCount.vue'
import { onMounted, ref } from 'vue'

// Example user - replace with api data
const user = {
    name: 'Alex',
}

// Sample data for attempted cases
const sampleCases: Case[] = [
    {
        id: 1,
        name: 'Read Chapters1-3',
        description: 'Read Chapters1-3',
        classroom: 1,
        completionDate: '12 May 2024',
        status: 'in progress',
    },
    {
        id: 2,
        name: 'Complete Problem Set #5',
        description: 'Complete Problem Set #5',
        classroom: 2,
        completionDate: '12 May 2024',
        status: 'not started',
    },
    {
        id: 3,
        name: 'Write Lab Report on Acid-Base Titration',
        description: 'Write Lab Report on Acid-Base Titration',
        classroom: 3,
        completionDate: '12 May 2024',
        status: 'in progress',
    },
    {
        id: 4,
        name: 'Prepare for Oral Presentation',
        description: 'Prepare for Oral Presentation',
        classroom: 4,
        completionDate: '12 May 2024',
        status: 'in progress',
    },
    {
        id: 5,
        name: 'Create Art Piece for Final Project',
        description: 'Create Art Piece for Final Project',
        classroom: 1,
        completionDate: '12 May 2024',
        status: 'completed',
    },
    {
        id: 6,
        name: 'Write Research Paper on Climate Change',
        description: 'Write Research Paper on Climate Change',
        classroom: 5,
        completionDate: '12 May 2024',
        status: 'in progress',
    },
    {
        id: 7,
        name: 'Complete Math Quiz on Algebra',
        description: 'Complete Math Quiz on Algebra',
        classroom: 2,
        completionDate: '12 May 2024',
        status: 'completed',
    },
    {
        id: 8,
        name: 'Prepare for History Class Debate',
        description: 'Prepare for History Class Debate',
        classroom: 6,
        completionDate: '12 May 2024',
        status: 'not started',
    },
    {
        id: 9,
        name: 'Submit Final Design for Architecture Project',
        description: 'Submit Final Design for Architecture Project',
        classroom: 7,
        completionDate: '12 May 2024',
        status: 'in progress',
    },
]

const caseData = ref<Case[]>([])

onMounted(async () => {
    // Fetch data from your API here.
    caseData.value = sampleCases
})
</script>
