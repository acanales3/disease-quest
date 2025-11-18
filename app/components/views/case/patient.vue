<template>
  <div>
    <BackwardButton route="/case/mentor"></BackwardButton>
    <ForwardButton route="/case/evaluation"></ForwardButton>
    <!-- need to add 'Patient and Diagnostic Interactions' to top right of header -->
  </div>
  <div>
    <CaseTextArea />
  </div>
  <div>
    <AgentDrawer title="Patient" />
    <AgentDrawer title="Mentor" />
  </div>
</template>

<script setup>
import BackwardButton from "~/components/BackwardButton/BackwardButton.vue";
import ForwardButton from "~/components/ForwardButton/ForwardButton.vue";
import CaseTextArea from "@/components/CaseTextArea/text-area.vue";
import AgentDrawer from "@/components/AgentDrawer/AgentDrawer.vue";
</script>

<style scoped></style>
