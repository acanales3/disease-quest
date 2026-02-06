<template>
  <div class="flex flex-col w-full mx-auto px-6 mb-20 space-y-10">
    <div class="flex flex-col items-center w-full pt-10 space-y-8">
      <!-- Stats Row (centered) -->
      <div class="flex justify-center gap-10">
        <TotalCount icon="mdi:star" :count="averageScoreLabel" label="Average Score" />
        <TotalCount
          icon="mdi:trending-up"
          :count="highestScoreLabel"
          label="Highest Score"
        />
        <TotalCount
          icon="mdi:calendar"
          :count="latestEvaluationLabel"
          label="Latest Evaluation"
        />
      </div>

      <!-- Graph Container (centered again) -->
      <div class="flex justify-center w-full">
        <ClassroomScores class="border shadow-md" />
      </div>

      <!-- Evaluation Agent Section -->
      <div class="flex flex-col items-center space-y-2 pt-4">
        <h1 class="text-lg font-bold">Evaluation Agent</h1>
        <p class="text-md text-muted-foreground">
          Discuss with your evaluation agent.
        </p>
      </div>

      <CaseTextArea />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import CaseTextArea from "@/components/CaseTextArea/text-area.vue";

import ClassroomScores from "../../graph/ScoresByCategoryGraph.vue";
import type { CaseScore } from "@/components/AssessmentCategoryScoreGraph/types";

import TotalCount from "~/components/ui/TotalCount.vue";

const user = useSupabaseUser();

type EvaluationRow = {
  activityName: string;
  date: string | null;
  score: number | null;
  feedback: string | null;
  progress: string;
};

const evaluations = ref<EvaluationRow[]>([]);
const isLoading = ref(false);

async function fetchEvaluations() {
  if (!user.value?.id) return;
  isLoading.value = true;
  try {
    const data = await $fetch<EvaluationRow[]>(
      `/api/students/${user.value.id}/evaluations`,
    );
    evaluations.value = data ?? [];
  } catch (error) {
    console.error("Failed to fetch evaluations:", error);
    evaluations.value = [];
  } finally {
    isLoading.value = false;
  }
}

const numericScores = computed(() =>
  evaluations.value
    .map((e) => e.score)
    .filter((v): v is number => typeof v === "number"),
);

const averageScoreLabel = computed(() => {
  if (isLoading.value) return "Loading...";
  if (numericScores.value.length === 0) return "N/A";
  const avg =
    numericScores.value.reduce((sum, v) => sum + v, 0) /
    numericScores.value.length;
  return avg.toFixed(2);
});

const highestScoreLabel = computed(() => {
  if (isLoading.value) return "Loading...";
  if (numericScores.value.length === 0) return "N/A";
  return Math.max(...numericScores.value).toFixed(2);
});

const latestEvaluationLabel = computed(() => {
  if (isLoading.value) return "Loading...";
  const dates = evaluations.value
    .map((e) => e.date)
    .filter((d): d is string => Boolean(d));
  if (dates.length === 0) return "N/A";
  const latest = new Date(
    Math.max(...dates.map((d) => new Date(d).getTime())),
  );
  return latest.toLocaleDateString();
});

const mockData: CaseScore[] = [
  { case: "Case 1", score: 85 },
  { case: "Case 2", score: 90 },
  { case: "Case 3", score: 75 },
  { case: "Case 4", score: 95 },
  { case: "Case 5", score: 80 },
  { case: "Case 6", score: 75 },
  { case: "Case 7", score: 95 },
  { case: "Case 8", score: 80 },
  { case: "Case 9", score: 95 },
  { case: "Case 10", score: 80 },
  { case: "Case 11", score: 75 },
  { case: "Case 12", score: 95 },
  { case: "Case 13", score: 80 },
];

const index: keyof CaseScore = "case";
const categories: (keyof CaseScore)[] = ["score"];

onMounted(fetchEvaluations);
watch(() => user.value?.id, fetchEvaluations);
</script>

<style scoped></style>
