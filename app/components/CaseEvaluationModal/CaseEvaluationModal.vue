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
        :render-session-dropdown="true"
        :sessions="sessions"
        :initial-session-id="selectedSessionId"
        @session-change="handleSessionChange"  
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

const sessions = ref<{ id: number; label: string }[]>([])
const selectedSessionId = ref<number | null>(null)

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
      const classroomId = caseEvaluationModalBus.classroomId

      // Fetch sessions
      const sessionResponse = await $fetch(
        `/api/case-sessions/${newCaseId}?classroomId=${classroomId}`
      )

      sessions.value = sessionResponse

      // Default session = the one used to open modal
      selectedSessionId.value = caseEvaluationModalBus.sessionId

      // Fetch evaluation for that session
      const response = await $fetch(
        `/api/analytics/session/${selectedSessionId.value}/score`
      )
      evaluationData.value = [response]

    } catch (err) {
      console.error(err);
    } finally {
      loading.value = false;
    }
  }
);

const handleSessionChange = async (sessionId: number) => {
  loading.value = true;
  evaluationData.value = [];

  try {
    selectedSessionId.value = sessionId

    const response = await $fetch(
      `/api/analytics/session/${sessionId}/score`
    )

    evaluationData.value = [response]

  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}
</script>