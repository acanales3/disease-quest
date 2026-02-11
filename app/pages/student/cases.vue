<template>
  <views-student-cases />
</template>

<script setup>
definePageMeta({
  layout: "student",
  middleware: ["role"],
  role: "STUDENT",
});
</script>
