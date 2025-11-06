<template>
  <div class="flex flex-col items-center">
    <h1>Dashboard</h1>
    <!-- Welcome Banner -->
    <div class="rounded-lg text-center flex flex-col items-center justify-center">
      <h2>Hey {{ user.name }}!</h2>
      <p>Welcome back to DiseaseQuest!</p>
    </div>

    <!-- Data -->
    <div class="flex justify-between">
      <TotalCount icon="ic:baseline-people" count="153" label="Students" />
      <TotalCount icon="material-symbols:clinical-notes-sharp" count="10" label="Instructors" />
      <TotalCount icon="mingcute:pencil-ruler-line" count="15" label="Classrooms" />
      <TotalCount icon="material-symbols:menu-book-outline" count="22" label="Cases" />
    </div>
  </div>
</template>

<script setup>

</script>
