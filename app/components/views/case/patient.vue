<template>
  <div class="flex justify-center">
    <BackwardButton route="/case/mentor"></BackwardButton>
    <ForwardButton route="/case/evaluation"></ForwardButton>
    <StepperFlowVisual></StepperFlowVisual>
    <!-- need to add 'Patient and Diagnostic Interactions' to top right of header -->
    <!-- need to add 'Case Name' above CaseTextArea   -->
  </div>
  <div class="flex justify-center">
    <h1 class="text-lg font-bold text-center">Case: {{ caseName }}</h1>
  </div>
  <div class="flex justify-center py-2">
    <CaseTextArea />
  </div>
  <div class="flex justify-center space-x-8 py-20 w-full">
    <AgentSheet agent="Diagnostic" side="left" />
    <AgentSheet agent="Mentor" side="right" />
  </div>
</template>

<script setup>
import BackwardButton from "~/components/BackwardButton/BackwardButton.vue";
import ForwardButton from "~/components/ForwardButton/ForwardButton.vue";
import CaseTextArea from "@/components/CaseTextArea/text-area.vue";
import AgentSheet from "@/components/AgentSheet/AgentSheet.vue";

const caseName = ref('')

import StepperFlowVisual from "~/components/StepperFlowVisual/StepperFlowVisual.vue";
</script>

<style scoped></style>
