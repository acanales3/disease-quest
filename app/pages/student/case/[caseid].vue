<template>
    <div class="w-full mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <!-- Top navigation bar with back button -->
        <div
            class="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white"
        >
            <button
                @click="goBack"
                class="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors"
            >
                <svg
                    class="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
            </button>
            <h1 class="text-lg font-semibold text-gray-900">Introduction</h1>
            <div class="w-8"></div>
        </div>

        <!-- Main content -->
        <div v-if="caseData" class="px-8 py-12 space-y-8">
            <!-- Case Title -->
            <div class="text-center space-y-4">
                <h2 class="text-3xl font-bold text-gray-900">
                    {{ caseData.name }}
                </h2>
            </div>

            <!-- Case Description/Introduction -->
            <div class="prose prose-sm max-w-none space-y-4">
                <p
                    v-for="(paragraph, index) in descriptionParagraphs"
                    :key="index"
                    class="text-gray-700 leading-relaxed text-sm font-light"
                >
                    {{ paragraph }}
                </p>
            </div>

            <!-- Spacer for visual balance (like in the image) -->
            <div class="h-16"></div>

            <!-- Bottom info section -->
            <div class="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
                <div class="text-center">
                    <p class="text-xs text-gray-500 font-medium uppercase">
                        Status
                    </p>
                    <span
                        :class="statusClasses[caseData.status]"
                        class="inline-block mt-2 px-3 py-1 rounded text-xs font-medium"
                    >
                        {{ statusText[caseData.status] }}
                    </span>
                </div>
                <div class="text-center">
                    <p class="text-xs text-gray-500 font-medium uppercase">
                        Classroom
                    </p>
                    <p class="text-gray-900 font-medium mt-2">
                        {{ caseData.classroom }}
                    </p>
                </div>
                <div class="text-center">
                    <p class="text-xs text-gray-500 font-medium uppercase">
                        Due Date
                    </p>
                    <p class="text-gray-900 font-medium mt-2">
                        {{ caseData.completionDate }}
                    </p>
                </div>
            </div>

            <!-- Action button -->
            <div class="flex justify-center pt-6 pb-4">
                <button
                    @click="startCase"
                    class="px-8 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                >
                    Start Case
                </button>
            </div>
        </div>

        <!-- Loading state -->
        <div v-else class="px-8 py-12 text-center">
            <p class="text-gray-600">Loading case...</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import type { Case } from '@/components/CaseDatatable/columns'
import { cases } from '@/assets/interface/Case'

definePageMeta({
    layout: 'student',
})

const router = useRouter()
const route = useRoute()
const caseData = ref<Case | null>(null)

const statusClasses = {
    'not started': 'bg-red-100 text-red-800',
    'in progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
}

const statusText = {
    'not started': 'Not Started',
    'in progress': 'In Progress',
    completed: 'Completed',
}

const descriptionParagraphs = computed(() => {
    if (!caseData.value) return []
    // Split description by double line breaks or periods followed by spaces
    // This will create multiple paragraphs for better readability
    return caseData.value.description
        .split(/\n\n+|\.\s+(?=[A-Z])/)
        .filter((p) => p.trim())
        .map((p) => {
            // Add period back if it was removed by the split
            return p.trim().endsWith('.') ? p.trim() : p.trim() + '.'
        })
})

const goBack = () => {
    router.push('/student/cases')
}

const startCase = () => {
    // TODO: Implement case start logic (maybe navigate to the actual case questions)
    console.log('Starting case:', caseData.value?.id)
}

onMounted(() => {
    const caseId = route.params.caseid
    const foundCase = cases.find((c) => c.id === Number(caseId))

    if (foundCase) {
        caseData.value = foundCase
    } else {
        console.error('Case not found:', caseId)
        // Redirect back to cases if case not found
        router.push('/student/cases')
    }
})
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
