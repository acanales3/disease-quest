<template>
  <views-admin-instructors />
</template>

<script setup>
definePageMeta({
  layout: "admin",
  middleware: ["role"],
  role: "ADMIN",
});
</script>
