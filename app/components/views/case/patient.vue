<template>
  <div class="space-y-8 w-full max-w-4xl mx-auto px-4">
    <div class="flex flex-col items-center w-full">
      <h1 class="text-lg font-bold pt-12">Patient Agent</h1>
      <p class="text-md text-muted-foreground ">Discuss with the patient</p>
      <CaseTextArea class="w-full"/>
    </div>
    <div class="flex justify-center space-x-50 w-full py-8">
      <AgentSheet agent="Diagnostic" side="left" />
      <AgentSheet agent="Mentor" side="right" />
    </div>
  </div>
</template>

<script setup>
import CaseTextArea from "@/components/CaseTextArea/text-area.vue";
import AgentSheet from "@/components/AgentSheet/AgentSheet.vue";
</script>

<style scoped></style>
