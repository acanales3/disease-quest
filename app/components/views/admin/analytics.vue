<template>
    <div class="w-full max-w-7xl space-y-4">
        <!-- Assessment Score by Category Section -->
        <graph-ScoresByCategoryGraph />

        <!-- Assessment Category Score Section -->
        <div class="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <div class="flex items-center justify-between mb-5">
                <h2 class="text-lg font-semibold text-gray-800">Assessment Category Score</h2>

                <div class="flex gap-2">
                    <!-- Category selector -->
                    <ui-dropdown-menu>
                        <ui-dropdown-menu-trigger as-child>
                            <button class="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                {{ selectedCategory || 'Diagnostic Tests' }} ▾
                            </button>
                        </ui-dropdown-menu-trigger>
                        <ui-dropdown-menu-content class="w-56">
                            <template v-for="cat in categoryOptions" :key="cat">
                                <ui-dropdown-menu-item @click="selectedCategory = cat">
                                    {{ cat }}
                                </ui-dropdown-menu-item>
                            </template>
                        </ui-dropdown-menu-content>
                    </ui-dropdown-menu>
                </div>
            </div>

            <!-- Simple Line Chart -->
            <div class="h-64 w-full relative">
                <svg class="w-full h-full" viewBox="0 0 900 280" preserveAspectRatio="xMidYMid meet">
                    <!-- Y-axis labels -->
                    <text x="30" y="30" text-anchor="end" font-size="12" fill="#9CA3AF">100</text>
                    <text x="30" y="85" text-anchor="end" font-size="12" fill="#9CA3AF">75</text>
                    <text x="30" y="140" text-anchor="end" font-size="12" fill="#9CA3AF">50</text>
                    <text x="30" y="195" text-anchor="end" font-size="12" fill="#9CA3AF">25</text>
                    <text x="30" y="250" text-anchor="end" font-size="12" fill="#9CA3AF">0</text>

                    <!-- Grid lines -->
                    <line x1="50" y1="30" x2="870" y2="30" stroke="#F3F4F6" stroke-width="1" />
                    <line x1="50" y1="85" x2="870" y2="85" stroke="#F3F4F6" stroke-width="1" />
                    <line x1="50" y1="140" x2="870" y2="140" stroke="#F3F4F6" stroke-width="1" />
                    <line x1="50" y1="195" x2="870" y2="195" stroke="#F3F4F6" stroke-width="1" />
                    <line x1="50" y1="250" x2="870" y2="250" stroke="#F3F4F6" stroke-width="1" />

                    <!-- X-axis labels -->
                    <text v-for="(point, idx) in chartData" :key="'x-' + idx"
                        :x="140 + (idx * 90)" y="270"
                        text-anchor="middle" font-size="12" fill="#9CA3AF">
                        {{ point.date }}
                    </text>

                    <!-- Area fill -->
                    <path
                        :d="areaPath"
                        fill="url(#gradient)"
                        opacity="0.5"
                    />

                    <!-- Line -->
                    <path
                        :d="linePath"
                        fill="none"
                        stroke="#F59E0B"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />

                    <!-- Data points -->
                    <circle v-for="(point, idx) in chartData" :key="'point-' + idx"
                        :cx="140 + (idx * 90)"
                        :cy="250 - (point.score * 2.2)"
                        r="4"
                        fill="#F59E0B"
                        stroke="white"
                        stroke-width="2"
                    />

                    <!-- Gradient definition -->
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#FDE68A;stop-opacity:0.6" />
                            <stop offset="100%" style="stop-color:#FEF3C7;stop-opacity:0.1" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const selectedCategory = ref('Diagnostic Tests')

const categoryOptions = [
    'History Taking and Synthesis',
    'Physical Exam Interpretation',
    'Differential Diagnosis Formulation',
    'Diagnostic Tests',
    'Management Reasoning',
    'Communication and Empathy',
    'Reflection and Metacognition',
]

// Mock data for the area chart
const chartData = ref([
    { date: 'Apr 10', score: 50 },
    { date: 'Apr 11', score: 45 },
    { date: 'Apr 12', score: 60 },
    { date: 'Apr 13', score: 55 },
    { date: 'Apr 14', score: 75 },
    { date: 'Apr 15', score: 70 },
    { date: 'Apr 16', score: 85 },
    { date: 'Apr 17', score: 65 },
    { date: 'Apr 18', score: 70 },
])

// Generate SVG path for the line
const linePath = computed(() => {
    const points = chartData.value.map((point, idx) => {
        const x = 140 + (idx * 90)
        const y = 250 - (point.score * 2.2) // 100% = 220px height
        return `${x},${y}`
    })
    return `M ${points.join(' L ')}`
})

// Generate SVG path for the area fill
const areaPath = computed(() => {
    const points = chartData.value.map((point, idx) => {
        const x = 140 + (idx * 90)
        const y = 250 - (point.score * 2.2)
        return `${x},${y}`
    })
    const firstX = 140
    const lastX = 140 + ((chartData.value.length - 1) * 90)
    return `M ${firstX},250 L ${points.join(' L ')} L ${lastX},250 Z`
})
</script>

<style scoped>
/* Custom styling if needed */
</style>
