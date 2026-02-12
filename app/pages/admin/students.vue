<template>
  <views-admin-students />
</template>

<script setup>
definePageMeta({
  layout: "admin",
  middleware: ["role"],
  role: "ADMIN",
});
</script>
