<template>
  <views-admin-classroom />
</template>

<script setup>
definePageMeta({
  layout: "admin",
  middleware: ["role"],
  role: "ADMIN",
});
</script>
