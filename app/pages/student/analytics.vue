<template>
  <views-student-analytics />
</template>

<script setup>
definePageMeta({
  layout: "student",
  middleware: ["role"],
  role: "STUDENT",
});
</script>
