<template>
  <div class="flex flex-col justify-start w-full gap-4">
    <!-- Welcome Banner -->
    <div
      class="rounded-lg text-center flex flex-col items-center justify-center w-full bg-white shadow-sm py-6"
    >
      <h1 class="text-lg font-bold text-gray-800">Hey {{ displayName }}!</h1>
      <p class="text-sm text-gray-500">Welcome back to DiseaseQuest!</p>
    </div>

    <!-- Data Cards -->
    <div class="flex justify-between gap-4">
      <TotalCount
        icon="hugeicons:students"
        :count="counts.students"
        label="Students"
      />
      <TotalCount
        icon="hugeicons:teacher"
        :count="counts.instructors"
        label="Instructors"
      />
      <TotalCount
        icon="simple-icons:googleclassroom"
        :count="counts.classrooms"
        label="Classrooms"
      />
      <TotalCount icon="si:book-line" :count="counts.cases" label="Cases" />
    </div>
  </div>
</template>

<script setup>
import TotalCount from "@/components/ui/TotalCount.vue";

const { data: stats, pending } = await useFetch("/api/admin/stats");

const displayName = computed(() => {
  const u = stats.value?.user;
  if (!u) return "Admin";
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || "Admin";
});

const counts = computed(
  () =>
    stats.value?.counts || {
      students: 0,
      instructors: 0,
      classrooms: 0,
      cases: 0,
    },
);
</script>
