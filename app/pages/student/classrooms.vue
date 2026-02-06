<template>
  <views-student-classrooms />
</template>

<script setup>
definePageMeta({
  layout: "student",
  middleware: ["role"],
  role: "STUDENT",
});
</script>
