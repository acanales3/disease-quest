<template>
  <views-admin-cases />
</template>

<script setup>
definePageMeta({
  layout: "admin",
  middleware: ["role"],
  role: "ADMIN",
});
</script>
