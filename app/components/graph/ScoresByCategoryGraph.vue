<template>
  <div class="container rounded-lg bg-white p-6">
    <div class="flex items-start justify-between mb-6">
      <h3 class="text-xl font-medium">Assessment Score by Category</h3>

      <div class="flex gap-3">
        <!-- Case selector -->
        <ui-dropdown-menu>
          <ui-dropdown-menu-trigger as-child>
            <button class="px-3 py-2 bg-gray-100 rounded text-sm">
              {{ selectedCase?.name || "Case" }} ▾
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
            <button class="px-3 py-2 bg-gray-100 rounded text-sm">
              {{ selectedClassroom?.name || "Classroom" }} ▾
            </button>
          </ui-dropdown-menu-trigger>
          <ui-dropdown-menu-content class="w-44">
            <template v-for="r in classroomsList" :key="r.id">
              <ui-dropdown-menu-item @click="selectedClassroom = r">{{
                r.name
              }}</ui-dropdown-menu-item>
            </template>
          </ui-dropdown-menu-content>
        </ui-dropdown-menu>
      </div>
    </div>

    <div class="space-y-4">
      <template v-for="(cat, i) in categories" :key="i">
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <div
              class="w-full bg-gray-100 rounded-full h-9 relative overflow-visible"
            >
              <div
                class="bg-indigo-200 h-9 rounded-full"
                :style="{ width: cat.score + '%' }"
              ></div>

              <!-- percentage pill anchored to the end of the filled area -->
              <div
                class="absolute top-1/2 z-10 px-2 py-0.5 bg-white border rounded-full text-xs text-gray-700 shadow-sm"
                :style="{
                  left: pillLeft(cat.score),
                  transform: 'translate(-50%, -50%)',
                }"
              >
                {{ cat.score }}%
              </div>
            </div>
          </div>

          <div class="w-56 text-right text-sm text-gray-700">
            {{ cat.label }}
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

type Category = { label: string; score: number };
type CaseItem = { id: string; name: string };
type ClassroomItem = { id: string; name: string };

const categories = ref<Category[]>([]);
const cases = ref<CaseItem[]>([]);
const classroomsList = ref<ClassroomItem[]>([]);

const selectedCase = ref<CaseItem | null>(null);
const selectedClassroom = ref<ClassroomItem | null>(null);

async function getData(): Promise<{
  categories: Category[];
  cases: CaseItem[];
  classrooms: ClassroomItem[];
}> {
  // API CALL NEEDED AND ALL PLACEHOLDERS ARE SET TO 0 FOR NOW
  // DATABASE MOCK SCORES NEED TO BE REMOVED
  return {
    categories: [
      { label: "History Taking and Synthesis", score: 0 },
      { label: "Physical Exam Interpretation", score: 0 },
      { label: "Differential Diagnosis Formulation", score: 0 },
      { label: "Diagnostic Tests", score: 0 },
      { label: "Management Reasoning", score: 0 },
      { label: "Communication and Empathy", score: 0 },
      { label: "Reflection and Metacognition", score: 0 },
    ],
    cases: [
      { id: "case-a", name: "Case A" },
      { id: "case-b", name: "Case B" },
      { id: "case-c", name: "Case C" },
    ],
    classrooms: [
      { id: "all", name: "All" },
      { id: "section-1", name: "Section 1" },
      { id: "section-2", name: "Section 2" },
    ],
  };
}

onMounted(async () => {
  const d = await getData();
  categories.value = d.categories;
  cases.value = d.cases;
  classroomsList.value = d.classrooms;
  selectedCase.value = cases.value[0] || null;
  selectedClassroom.value = classroomsList.value[0] || null;
});

const pillLeft = (score: number) => {
  const min = 3; // percent from left edge
  const max = 97; // percent from left edge
  const clamped = Math.min(Math.max(Math.round(score), min), max);
  return `${clamped}%`;
};
</script>

<style scoped></style>
