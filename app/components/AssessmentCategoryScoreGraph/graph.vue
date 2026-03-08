<template>
  <div class="p-6 bg-white border border-gray-200 rounded-xl overflow-x-auto">
    <div class="flex items-center justify-between mb-7">
      <!-- Left-aligned title -->
      <div>
        <p
          class="text-[11px] font-semibold uppercase tracking-widest text-[#4d1979] mb-1"
        >
          Analytics
        </p>
        <h2 class="text-[20px] font-semibold tracking-tight text-gray-900">
          {{ title }}
        </h2>
        <p class="text-[12px] text-gray-400 mt-0.5">
          Score progression across attempts over time
        </p>
      </div>

      <!-- Right-aligned dropdowns -->
      <div class="flex gap-3">
        <!-- Category selector -->
        <ui-dropdown-menu>
          <ui-dropdown-menu-trigger as-child>
            <button
              class="px-3.5 h-9 border border-gray-200 rounded-lg text-[13px] font-medium min-w-[180px] flex justify-between items-center text-gray-700 bg-white"
            >
              {{ selectedCategory?.name || "All Categories" }} ▾
            </button>
          </ui-dropdown-menu-trigger>
          <ui-dropdown-menu-content class="w-64 max-h-60 overflow-y-auto">
            <ui-dropdown-menu-item @click="selectedCategory = null"
              >All Categories</ui-dropdown-menu-item
            >
            <template v-for="c in categoryList" :key="c.id">
              <ui-dropdown-menu-item @click="selectedCategory = c">
                {{ c.name }}
              </ui-dropdown-menu-item>
            </template>
          </ui-dropdown-menu-content>
        </ui-dropdown-menu>

        <!-- Case selector -->
        <ui-dropdown-menu>
          <ui-dropdown-menu-trigger as-child>
            <button
              class="px-3.5 h-9 border border-gray-200 rounded-lg text-[13px] font-medium min-w-[140px] flex justify-between items-center text-gray-700 bg-white"
            >
              {{ selectedCase?.name || "All Cases" }} ▾
            </button>
          </ui-dropdown-menu-trigger>
          <ui-dropdown-menu-content class="w-44 max-h-60 overflow-y-auto">
            <ui-dropdown-menu-item @click="selectedCase = null"
              >All Cases</ui-dropdown-menu-item
            >
            <template v-for="c in caseList" :key="c.id">
              <ui-dropdown-menu-item @click="selectedCase = c">
                {{ c.name }}
              </ui-dropdown-menu-item>
            </template>
          </ui-dropdown-menu-content>
        </ui-dropdown-menu>

        <!-- Classroom selector -->
        <ui-dropdown-menu>
          <ui-dropdown-menu-trigger as-child>
            <button
              class="px-3.5 h-9 border border-gray-200 rounded-lg text-[13px] font-medium min-w-[140px] flex justify-between items-center text-gray-700 bg-white"
            >
              {{ selectedClassroom?.name || "All Classrooms" }} ▾
            </button>
          </ui-dropdown-menu-trigger>
          <ui-dropdown-menu-content class="w-44 max-h-60 overflow-y-auto">
            <ui-dropdown-menu-item @click="selectedClassroom = null"
              >All Classrooms</ui-dropdown-menu-item
            >
            <template v-for="r in classroomsList" :key="r.id">
              <ui-dropdown-menu-item @click="selectedClassroom = r">
                {{ r.name }}
              </ui-dropdown-menu-item>
            </template>
          </ui-dropdown-menu-content>
        </ui-dropdown-menu>
      </div>
    </div>

    <!-- Attempt count badge -->
    <div v-if="!loading && chartData.length > 0" class="mb-4">
      <span
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600"
      >
        {{ chartData.length }} attempt{{
          chartData.length !== 1 ? "s" : ""
        }}
        plotted
      </span>
    </div>

    <!-- Chart -->
    <div class="min-w-fit" v-if="!loading && chartData.length > 1">
      <LineChart
        :data="chartData"
        :index="xAxisKey"
        :categories="activeCategories"
        :colors="colors"
        showTooltip
        showLegend
        legendPosition="bottom"
        showGridLine
        showXAxis
        showYAxis
        :xLabel="xAxisLabel"
        yLabel="Score (%)"
        :y-formatter="formatYAxis"
        :margin="{ top: 20, right: 20, bottom: 80, left: 80 }"
      />
    </div>

    <!-- Single data point — can't draw a line, show a summary instead -->
    <div v-else-if="!loading && chartData.length === 1" class="py-8 space-y-3">
      <p class="text-center text-sm text-gray-500">
        Only one attempt recorded — complete more attempts to see progress over
        time.
      </p>
      <div class="max-w-sm mx-auto space-y-2">
        <div
          v-for="cat in activeCategories"
          :key="cat"
          class="flex items-center justify-between text-sm"
        >
          <span class="text-gray-600">{{ cat }}</span>
          <span class="font-medium tabular-nums text-gray-800"
            >{{ chartData[0][cat] ?? 0 }}%</span
          >
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="text-center py-8 text-sm text-gray-500">
      Loading chart...
    </div>
    <div v-else class="text-center py-8 text-sm text-gray-500">
      No data available for the selected filters.
    </div>
  </div>
</template>

<script setup lang="ts">
import LineChart from "@/components/ui/chart-line/LineChart.vue";
import type { AnalyticsScoreEntry } from "@/types/analytics";
import { computed, ref, watchEffect } from "vue";
import { useRoute } from "#imports";

const route = useRoute();

const props = defineProps<{
  data: AnalyticsScoreEntry[];
  loading?: boolean;
  title?: string;
  colors?: string[];
}>();

const defaultColors = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#84CC16",
  "#10B981",
  "#06B6D4",
  "#3B82F6",
];
const colors = computed(() => props.colors ?? defaultColors);
const title = props.title ?? "Score Progress Over Attempts";

// ── Category map ────────────────────────────────────────────────
const KEY_TO_LABEL: Record<string, string> = {
  history_taking_synthesis: "History Taking and Synthesis",
  physical_exam_interpretation: "Physical Exam Interpretation",
  differential_diagnosis_formulation: "Differential Diagnosis Formulation",
  diagnostic_tests: "Diagnostic Tests",
  management_reasoning: "Management Reasoning",
  communication_empathy: "Communication and Empathy",
  reflection_metacognition: "Reflection and Metacognition",
};

const categoryList = Object.entries(KEY_TO_LABEL).map(([key, label]) => ({
  id: key,
  name: label,
}));

// ── Derive filter lists from data ────────────────────────────────
const caseList = computed(() => {
  const map = new Map<number, string>();
  props.data.forEach((d) => map.set(d.caseId, d.caseName));
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

const classroomsList = computed(() => {
  const map = new Map<number, string>();
  props.data.forEach((d) => map.set(d.classroomId, d.classroomName));
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

// ── Filter state ─────────────────────────────────────────────────
const selectedCategory = ref<{ id: string; name: string } | null>(null);
const selectedCase = ref<{ id: number; name: string } | null>(null);
const selectedClassroom = ref<{ id: number; name: string } | null>(null);

// Sync classroom from route query (e.g. navigating from classroom page)
watchEffect(() => {
  const classroomIdQuery = route.query.classroomId;
  if (classroomIdQuery) {
    const id = Number(classroomIdQuery);
    const nameQuery = route.query.classroomName as string;
    const found = classroomsList.value.find((c) => c.id === id);
    selectedClassroom.value = found ?? {
      id,
      name: nameQuery || "Selected Classroom",
    };
  }
});

// ── Chart data ───────────────────────────────────────────────────
// X-axis label strategy:
//   - Filtering by a single case  → "Attempt 1", "Attempt 2", …
//   - Showing all cases           → "Case · Attempt N" label
//
// Data is already sorted chronologically by the API (completedAt asc).
// We preserve that order here and just build readable X-axis labels.

const xAxisKey = "attempt"; // key in chart row objects

const xAxisLabel = computed(() =>
  selectedCase.value
    ? `Attempts — ${selectedCase.value.name}`
    : "Case · Attempt",
);

const chartData = computed(() => {
  if (!props.data?.length) return [];

  // 1. Filter
  const filtered = props.data.filter((d) => {
    if (selectedCase.value && d.caseId !== selectedCase.value.id) return false;
    if (selectedClassroom.value && d.classroomId !== selectedClassroom.value.id)
      return false;
    return true;
  });

  if (!filtered.length) return [];

  // 2. Data is already sorted chronologically by the API.
  //    Build attempt-counter per case so each attempt has a stable label.
  const attemptCounterPerCase = new Map<number, number>();

  const keysToProcess = selectedCategory.value
    ? [selectedCategory.value.id]
    : Object.keys(KEY_TO_LABEL);

  return filtered.map((d) => {
    // Increment attempt counter for this case
    const prev = attemptCounterPerCase.get(d.caseId) ?? 0;
    const attemptIndex = prev + 1;
    attemptCounterPerCase.set(d.caseId, attemptIndex);

    // X-axis label
    const xLabel = selectedCase.value
      ? `Attempt ${attemptIndex}`
      : `${d.caseName} · A${attemptIndex}`;

    const row: Record<string, string | number> = { [xAxisKey]: xLabel };

    for (const key of keysToProcess) {
      const label = KEY_TO_LABEL[key];
      if (!label) continue;
      // Scores from API are already 0–100 integers
      row[label] = (d[key as keyof AnalyticsScoreEntry] as number) ?? 0;
    }

    return row;
  });
});

const activeCategories = computed(() => {
  if (selectedCategory.value) return [selectedCategory.value.name];
  return Object.values(KEY_TO_LABEL);
});

const formatYAxis = (tick: number | Date) => `${tick}%`;
</script>

<style scoped></style>
