<template>
  <Dialog
    :open="caseEvaluationModalBus.openModal"
    @update:open="handleOpenChange"
  >
    <DialogContent>
      <ClassroomScores
        v-if="evaluationData.length"
        class="mb-8"
        :data="evaluationData"
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
  () => caseEvaluationModalBus.caseId,
  async (newCaseId) => {
    if (!newCaseId) return;

    loading.value = true;
    evaluationData.value = [];

    try {
      const response = await $fetch(
        `/api/analytics/${newCaseId}/score`
      );

      evaluationData.value = [response];
    } catch (err) {
      console.error(err);
    } finally {
      loading.value = false;
    }
  }
);
</script>