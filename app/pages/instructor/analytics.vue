<template>
  <views-instructor-analytics />
</template>

<script setup>
definePageMeta({
  layout: "instructor",
  middleware: ["role"],
  role: "INSTRUCTOR",
});
</script>
