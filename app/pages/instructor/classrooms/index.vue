<template>
  <views-instructor-classrooms />
</template>

<script setup>
definePageMeta({
  layout: "instructor",
  middleware: ["role"],
  role: "INSTRUCTOR",
});
</script>
