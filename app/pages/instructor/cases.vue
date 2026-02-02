<template>
  <views-instructor-cases />
</template>

<script setup>
definePageMeta({
  layout: "instructor",
  middleware: ["role"],
  role: "INSTRUCTOR",
});
</script>
