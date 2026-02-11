<template>
  <views-instructor-classroom />
</template>

<script setup>
definePageMeta({
  layout: "instructor",
  middleware: ["role"],
  role: "INSTRUCTOR",
});
</script>
