<template>
  <views-admin-admins />
</template>

<script setup>
definePageMeta({
  layout: "admin",
  middleware: ["role"],
  role: "ADMIN",
});
</script>
