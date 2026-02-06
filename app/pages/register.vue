<template>
  <views-register />
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import useSupabaseAuth from "~/composables/useSupabaseAuth";

definePageMeta({
  layout: false, // Changed from 'none' to false (Nuxt 3 standard)
});

const router = useRouter();
const { user, fetchCustomUser } = useSupabaseAuth();

// Auto-redirect if already logged in
onMounted(async () => {
  if (user.value) {
    const profile = await fetchCustomUser();

    if (profile?.role) {
      console.log("User already logged in, redirecting to dashboard");
      router.push(`/${profile.role.toLowerCase()}/dashboard`);
    }
  }
});
</script>

<style scoped></style>
