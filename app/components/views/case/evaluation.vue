<script setup lang="ts">
import CaseTextArea from "@/components/CaseTextArea/text-area.vue";

import ClassroomScores from "../../graph/ScoresByCategoryGraph.vue";
import type { CaseScore } from "@/components/AssessmentCategoryScoreGraph/types";
import ReflectionDocumentButton from "../../ReflectionDocumentButton/ReflectionDocumentButton.vue";

import TotalCount from "~/components/ui/TotalCount.vue";

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

const reflectionData = {
  studentName: "Student Name",
  caseTitle: "Case 12",
  completionDate: "Feb 5, 2026",
  highest: { score: 96, category: "Management Reasoning" },
  lowest: { score: 62, category: "History Taking and Synthesis" },
  categories: [
    { label: "History Taking and Synthesis", score: 0 },
    { label: "Physical Exam Interpretation", score: 0 },
    { label: "Differential Diagnosis Formulation", score: 0 },
    { label: "Diagnostic Tests", score: 0 },
    { label: "Management Reasoning", score: 0 },
    { label: "Communication and Empathy", score: 0 },
    { label: "Reflection and Metacognition", score: 0 },
  ],
  strengths: [
    "Clear problem representation",
    "Good prioritization of key findings",
  ],
  areasOfGrowth: [
    "Ask more targeted ROS questions",
    "Tighten the differential earlier",
  ],
  keyMistakes: [
    "Ordered broad labs without justification",
    "Missed a key red-flag symptom",
  ],
};

const index: keyof CaseScore = "case";
const categories: (keyof CaseScore)[] = ["score"];
</script>

<template>
  <div class="flex flex-col w-full mx-auto px-6 mb-20 space-y-10">
    <div class="flex flex-col items-center w-full pt-10 space-y-8">
      <!-- Stats Row (centered) -->
      <div class="flex justify-center gap-10">
        <TotalCount icon="mdi:star" :count="`87%`" label="Average Score" />
        <TotalCount
          icon="mdi:trending-up"
          :count="`96%`"
          label="Highest Score"
        />
        <TotalCount
          icon="mdi:calendar"
          :count="`Nov 19`"
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

      <!-- Pull scores/date from DB, but keep these arrays from the local const -->
      <!-- Change later: SCRUM-186 Pull scores/date from DB, but keep these arrays from the local const -->
      <ReflectionDocumentButton
        :case-id="1"
        :strengths="reflectionData.strengths"
        :areas-of-growth="reflectionData.areasOfGrowth"
        :key-mistakes="reflectionData.keyMistakes"
      />
    </div>
  </div>
</template>

<style scoped></style>
