<template>
  <div class="flex flex-col justify-start w-full gap-4">
    <!-- Welcome Banner -->
    <div class="rounded-lg text-center flex flex-col items-center justify-center w-full bg-white shadow-sm py-6">
      <h1 class="text-lg font-bold text-gray-800">Hey {{ user.name }}!</h1>
      <p class="text-sm text-gray-500">Welcome back to DiseaseQuest!</p>
    </div>

    <!-- Data Cards -->
    <div class="flex justify-between gap-4">
      <TotalCount icon="ic:baseline-people" count="153" label="Students" />
      <TotalCount icon="material-symbols:clinical-notes-sharp" count="10" label="Instructors" />
      <TotalCount icon="mingcute:pencil-ruler-line" count="5" label="Classrooms" />
      <TotalCount icon="material-symbols:menu-book-outline" count="22" label="Cases" />
    </div>
  </div>
</template>

<script setup>
import TotalCount from "@/components/ui/TotalCount.vue";
// Example user - replace with api data
const user = {
  name: "Admin",
}
</script>
