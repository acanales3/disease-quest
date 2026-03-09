<template>
  <div class="rounded-xl border border-gray-200 bg-white p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <p
          class="text-[11px] font-semibold uppercase tracking-widest text-[#4d1979] mb-1"
        >
          Analytics
        </p>
        <h3 class="text-[18px] font-semibold tracking-tight text-gray-900">
          Assessment Score by Category
        </h3>
        <p class="text-[12px] text-gray-400 mt-0.5">
          Weighted average across all attempts
        </p>
      </div>

      <div class="flex gap-2">
        <!-- Case selector -->
        <ui-dropdown-menu>
          <ui-dropdown-menu-trigger as-child>
            <button
              class="px-3 h-8 border border-gray-200 rounded-lg text-[12px] font-medium min-w-[120px] flex justify-between items-center gap-2 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
            >
              <span class="truncate">{{
                selectedCase?.name || "All Cases"
              }}</span>
              <span class="text-gray-400 text-[10px]">▾</span>
            </button>
          </ui-dropdown-menu-trigger>
          <ui-dropdown-menu-content class="w-44 max-h-60 overflow-y-auto">
            <ui-dropdown-menu-item @click="selectedCase = null"
              >All Cases</ui-dropdown-menu-item
            >
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
            <button
              class="px-3 h-8 border border-gray-200 rounded-lg text-[12px] font-medium min-w-[130px] flex justify-between items-center gap-2 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
            >
              <span class="truncate">{{
                selectedClassroom?.name || "All Classrooms"
              }}</span>
              <span class="text-gray-400 text-[10px]">▾</span>
            </button>
          </ui-dropdown-menu-trigger>
          <ui-dropdown-menu-content class="w-44 max-h-60 overflow-y-auto">
            <ui-dropdown-menu-item @click="selectedClassroom = null"
              >All Classrooms</ui-dropdown-menu-item
            >
            <template v-for="r in classroomsList" :key="r.id">
              <ui-dropdown-menu-item @click="selectedClassroom = r">{{
                r.name
              }}</ui-dropdown-menu-item>
            </template>
          </ui-dropdown-menu-content>
        </ui-dropdown-menu>
      </div>
    </div>

    <!-- Attempt count badge -->
    <div v-if="!loading && filteredAttemptCount > 0" class="mb-4">
      <span
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600"
      >
        {{ filteredAttemptCount }} attempt{{
          filteredAttemptCount !== 1 ? "s" : ""
        }}
        averaged
      </span>
    </div>

    <!-- Bars -->
    <div class="space-y-3" v-if="!loading && processedCategories.length">
      <template v-for="(cat, i) in processedCategories" :key="i">
        <div class="flex items-center gap-4">
          <!-- Bar -->
          <div class="flex-1 relative">
            <div
              class="w-full bg-gray-100 rounded-full h-8 relative overflow-visible"
            >
              <div
                class="h-8 rounded-full"
                :style="{
                  width: animated ? cat.score + '%' : '0%',
                  background: 'linear-gradient(90deg, #0f766e, #0d9488)',
                  transition: `width 600ms cubic-bezier(0.4,0,0.2,1) ${i * 80}ms`,
                }"
              ></div>
              <!-- Pill -->
              <div
                class="absolute top-1/2 z-10 px-2.5 py-0.5 bg-white rounded-md text-[11px] font-semibold text-gray-800 shadow-[0_1px_4px_rgba(0,0,0,0.12)] tabular-nums tracking-tight"
                :style="{
                  left: animated ? pillLeft(cat.score) : '0%',
                  transform: 'translate(-50%, -50%)',
                  transition: `left 600ms cubic-bezier(0.4,0,0.2,1) ${i * 80}ms, opacity 300ms ease ${i * 80}ms`,
                  opacity: animated ? 1 : 0,
                }"
              >
                {{ cat.score }}%
              </div>
            </div>
          </div>
          <!-- Label -->
          <div
            class="w-56 text-right text-[12px] font-medium text-gray-500 leading-snug shrink-0"
          >
            {{ cat.label }}
          </div>
        </div>
      </template>
    </div>

    <div v-else-if="loading" class="text-center py-8 text-sm text-gray-400">
      Loading data...
    </div>
    <div v-else class="text-center py-8 text-sm text-gray-400">
      No data available for the selected filters.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import type { AnalyticsScoreEntry } from "@/types/analytics";
import { useRoute } from "#imports";

const route = useRoute();

type Category = { label: string; score: number };
type Item = { id: number; name: string };

const props = defineProps<{
  data: AnalyticsScoreEntry[];
  loading?: boolean;
}>();

const selectedCase = ref<Item | null>(null);
const selectedClassroom = ref<Item | null>(null);

// Derive unique case/classroom lists from the per-attempt rows
const cases = computed(() => {
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

// Sync classroom from route query
watch(
  () => route.query.classroomId,
  (val) => {
    if (!val) return;
    const id = Number(val);
    const nameQuery = route.query.classroomName as string;
    const found = classroomsList.value.find((c) => c.id === id);
    selectedClassroom.value = found ?? {
      id,
      name: nameQuery || "Selected Classroom",
    };
  },
  { immediate: true },
);

// Score fields
const SCORE_FIELDS: (keyof AnalyticsScoreEntry)[] = [
  "history_taking_synthesis",
  "physical_exam_interpretation",
  "differential_diagnosis_formulation",
  "diagnostic_tests",
  "management_reasoning",
  "communication_empathy",
  "reflection_metacognition",
];

const FIELD_LABELS: Record<string, string> = {
  history_taking_synthesis: "History Taking and Synthesis",
  physical_exam_interpretation: "Physical Exam Interpretation",
  differential_diagnosis_formulation: "Differential Diagnosis Formulation",
  diagnostic_tests: "Diagnostic Tests",
  management_reasoning: "Management Reasoning",
  communication_empathy: "Communication and Empathy",
  reflection_metacognition: "Reflection and Metacognition",
};

// Filtered rows (each row = one attempt, count always 1)
const filteredRows = computed(() =>
  props.data.filter((d) => {
    if (selectedCase.value && d.caseId !== selectedCase.value.id) return false;
    if (selectedClassroom.value && d.classroomId !== selectedClassroom.value.id)
      return false;
    return true;
  }),
);

const filteredAttemptCount = computed(() => filteredRows.value.length);

// Simple arithmetic average across all filtered attempts
// (count is always 1 per row, so a plain average equals the weighted average)
const processedCategories = computed<Category[]>(() => {
  if (!filteredRows.value.length) return [];

  return SCORE_FIELDS.map((field) => {
    const values = filteredRows.value.map((d) => Number(d[field] ?? 0));
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    return {
      label: FIELD_LABELS[field as string] ?? String(field),
      score: Math.round(avg * 10) / 10,
    };
  });
});

// Animation
const animated = ref(false);

watch(
  processedCategories,
  async () => {
    animated.value = false;
    await nextTick();
    setTimeout(() => {
      animated.value = true;
    }, 30);
  },
  { immediate: true },
);

const pillLeft = (score: number) => {
  const clamped = Math.min(Math.max(Math.round(score), 3), 97);
  return `${clamped}%`;
};
</script>

<style scoped></style>
