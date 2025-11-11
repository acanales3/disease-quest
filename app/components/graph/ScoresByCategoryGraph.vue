<template>
    <div class="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
        <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-semibold text-gray-800">Assessment Score by Category</h2>

            <div class="flex gap-2">
                <!-- Case selector -->
                <ui-dropdown-menu>
                    <ui-dropdown-menu-trigger as-child>
                        <button class="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                            {{ selectedCase?.name || 'Case' }} ▾
                        </button>
                    </ui-dropdown-menu-trigger>
                    <ui-dropdown-menu-content class="w-44">
                        <template v-for="c in cases" :key="c.id">
                            <ui-dropdown-menu-item @click="selectedCase = c">{{
                                c.name
                            }}</ui-dropdown-menu-item>
                        </template>
                    </ui-dropdown-menu-content>
                </ui-dropdown-menu>

                <!-- Classroom selector -->
                <ui-dropdown-menu>
                    <ui-dropdown-menu-trigger as-child>
                        <button class="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                            {{ selectedClassroom?.name || 'Classroom' }} ▾
                        </button>
                    </ui-dropdown-menu-trigger>
                    <ui-dropdown-menu-content class="w-44">
                        <template v-for="r in classroomsList" :key="r.id">
                            <ui-dropdown-menu-item
                                @click="selectedClassroom = r"
                                >{{ r.name }}</ui-dropdown-menu-item
                            >
                        </template>
                    </ui-dropdown-menu-content>
                </ui-dropdown-menu>
            </div>
        </div>

        <div class="space-y-3">
            <template v-for="(cat, i) in categories" :key="i">
                <div class="flex items-center gap-4">
                    <div class="flex-1">
                        <div
                            class="w-full bg-gray-50 rounded-md h-8 relative overflow-visible"
                        >
                            <div
                                class="bg-indigo-200 h-8 rounded-md transition-all duration-500 ease-out"
                                :style="{ width: cat.score + '%' }"
                            ></div>

                            <!-- percentage pill anchored to the end of the filled area -->
                            <div
                                class="absolute top-1/2 z-10 px-2.5 py-0.5 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700 shadow-sm"
                                :style="{
                                    left: pillLeft(cat.score),
                                    transform: 'translate(-50%, -50%)',
                                }"
                            >
                                {{ cat.score }}%
                            </div>
                        </div>
                    </div>

                    <div class="w-56 text-right text-xs font-medium text-gray-600">
                        {{ cat.label }}
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

type Category = { label: string; score: number }
type CaseItem = { id: string; name: string }
type ClassroomItem = { id: string; name: string }

const categories = ref<Category[]>([])
const cases = ref<CaseItem[]>([])
const classroomsList = ref<ClassroomItem[]>([])

const selectedCase = ref<CaseItem | null>(null)
const selectedClassroom = ref<ClassroomItem | null>(null)

async function getData(): Promise<{
    categories: Category[]
    cases: CaseItem[]
    classrooms: ClassroomItem[]
}> {
    // Replace with real API call later. Return plain data for now.
    return {
        categories: [
            { label: 'History Taking and Synthesis', score: 55 },
            { label: 'Physical Exam Interpretation', score: 85 },
            { label: 'Differential Diagnosis Formulation', score: 62 },
            { label: 'Diagnostic Tests', score: 72 },
            { label: 'Management Reasoning', score: 68 },
            { label: 'Communication and Empathy', score: 76 },
            { label: 'Reflection and Metacognition', score: 80 },
        ],
        cases: [
            { id: 'case-a', name: 'Case A' },
            { id: 'case-b', name: 'Case B' },
            { id: 'case-c', name: 'Case C' },
        ],
        classrooms: [
            { id: 'all', name: 'All' },
            { id: 'section-1', name: 'Section 1' },
            { id: 'section-2', name: 'Section 2' },
        ],
    }
}

onMounted(async () => {
    const d = await getData()
    categories.value = d.categories
    cases.value = d.cases
    classroomsList.value = d.classrooms
    selectedCase.value = cases.value[0] || null
    selectedClassroom.value = classroomsList.value[0] || null
})

const pillLeft = (score: number) => {
    const min = 3 // percent from left edge
    const max = 97 // percent from left edge
    const clamped = Math.min(Math.max(Math.round(score), min), max)
    return `${clamped}%`
}
</script>

<style scoped></style>
