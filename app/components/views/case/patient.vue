<template>
  <div>
    <StepperFlowVisual></StepperFlowVisual>
    <h1>Case Patient Page</h1>
    <BackwardButton route="/case/mentor"></BackwardButton>
    <ForwardButton route="/case/evaluation"></ForwardButton>
    <!-- need to add 'Patient and Diagnostic Interactions' to top right of header -->
    <!-- need to add 'Case Name' above CaseTextArea   -->
  </div>
  <div class="flex justify-center py-10 min-h-[calc(100vh-22rem)]">
    Now let's get started with {{ caseName }}
    <CaseTextArea />
  </div>
  <div class="flex justify-center space-x-4 py-10 w-full">
    <AgentDrawer agent="Diagnostic" />
    <AgentDrawer agent="Mentor" />
  </div>
</template>

<script setup>
import BackwardButton from "~/components/BackwardButton/BackwardButton.vue";
import ForwardButton from "~/components/ForwardButton/ForwardButton.vue";
import CaseTextArea from "@/components/CaseTextArea/text-area.vue";
import AgentDrawer from "@/components/AgentDrawer/AgentDrawer.vue";

const caseName = ref('')

import StepperFlowVisual from "~/components/StepperFlowVisual/StepperFlowVisual.vue";
</script>

<style scoped></style>
