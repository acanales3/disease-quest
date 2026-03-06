<template>
  <Dialog :open="caseEvaluationModalBus.openModal" @update:open="handleOpenChange">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          Evaluation Metrics
        </DialogTitle>
      </DialogHeader>
      <ClassroomScores 
        v-if="evaluationData.length" 
        class="mb-8" 
        :data="evaluationData" 
        :render-dropdowns="false" 
      />

      <div v-else class="text-center py-6 text-gray-500">
        Loading...
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
} from "@/components/ui/dialog";

import ClassroomScores from "@/components/graph/ScoresByCategoryGraph.vue";
import { ref, watch } from "vue";
import { caseEvaluationModalBus } from "@/components/CaseEvaluationModal/modalBusCaseEvaluation";

const evaluationData = ref<any[]>([]);
const loading = ref(false);

const handleOpenChange = (value: boolean) => {
  if (!value) {
    caseEvaluationModalBus.close();
  }
};

watch(
  () => caseEvaluationModalBus.openModal,
  async (isOpen) => {
    if (!isOpen || !caseEvaluationModalBus.sessionId) return;

    loading.value = true;
    evaluationData.value = [];

    try {
      const response = await $fetch(
        `/api/analytics/${caseEvaluationModalBus.sessionId}/score`
      );
      evaluationData.value = [response];
    } catch (err) {
      console.error("Failed to fetch evaluation:", err);
    } finally {
      loading.value = false;
    }
  }
);
</script>