<template>
  <header class="p-4 flex justify-end gap-4">
    <NuxtLink to="/settings">
      <div
        class="bg-gray-200 rounded-full p-2 flex items-center justify-center hover:bg-gray-300"
      >
        <Icon name="mdi-light:settings" class="text-xl" />
      </div>
    </NuxtLink>

    <!-- Changed from NuxtLink to button with click handler -->
    <button
      @click="handleLogout"
      :disabled="isLoggingOut"
      class="bg-gray-200 rounded-full p-2 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Icon name="mdi:logout" class="text-xl" />
    </button>
  </header>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import useSupabaseAuth from "~/composables/useSupabaseAuth";

const router = useRouter();
const { logout } = useSupabaseAuth();
const isLoggingOut = ref(false);

const handleLogout = async () => {
  isLoggingOut.value = true;

  const { error } = await logout();

  if (error) {
    console.error("Logout error:", error);
    alert("Failed to logout. Please try again.");
    isLoggingOut.value = false;
    return;
  }

  console.log("Logout successful, redirecting to login");
  await router.push("/login");

  isLoggingOut.value = false;
};
</script>

<style scoped></style>
