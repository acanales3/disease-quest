<template>
  <div class="flex flex-col min-h-screen bg-gray-100">
    <!-- Top Row -->
    <div class="w-full flex justify-between p-4">
      <BackwardButton route="/case/introduction"></BackwardButton>
      <h1 class="font-semibold text-2xl">Mentor Conversation</h1>
    </div>

    <div>
      <h1 class="font-semibold text-center text-2xl p-4">{{ caseName }}</h1>
      <CaseTextArea />
    </div>

    <div class="mt-auto p-4 flex">
      <NuxtLink to="/case/patient" class="ml-auto">
        <button class="rounded-lg shadow-sm px-4 py-2 bg-white transition-colors duration-500 hover:bg-gray-100">Next</button>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import CaseTextArea from '@/components/CaseTextArea/text-area.vue';
import BackwardButton from '~/components/BackwardButton/BackwardButton.vue';

const caseName = ref("Case Name");
</script>

<style scoped></style>
