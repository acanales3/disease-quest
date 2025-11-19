<template>
  <div class="flex flex-col space-y-8 w-full mx-auto px-4">
    <div class="flex flex-col items-center w-full">
      <h1 class="text-lg font-bold pt-12">Mentor Agent</h1>
      <p class="text-md text-muted-foreground">Discuss with your mentor before meeting the patient.</p>
      <CaseTextArea />
    </div>
  </div>
</template>

<script setup>
import CaseTextArea from '@/components/CaseTextArea/text-area.vue';

</script>

<style scoped></style>
