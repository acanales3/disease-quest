<template>
  <views-instructor-students />
</template>

<script setup>
definePageMeta({
  layout: "instructor",
  middleware: ["role"],
  role: "INSTRUCTOR",
});
</script>
