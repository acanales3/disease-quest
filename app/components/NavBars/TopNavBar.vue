<template>
  <header class="p-4 flex justify-between items-center gap-4">

    <!-- Hamburger — mobile only -->
    <button
      @click="$emit('toggle-sidebar')"
      class="lg:hidden bg-gray-100 rounded-full p-2 flex items-center justify-center hover:bg-gray-200 transition-colors"
    >
      <Icon name="mdi:menu" class="text-xl" />
    </button>

    <!-- Spacer so icons stay right on desktop -->
    <div class="flex-1" />

    <NuxtLink to="/settings">
      <div class="bg-gray-200 rounded-full p-2 flex items-center justify-center hover:bg-gray-300 transition-colors">
        <Icon name="mdi-light:settings" class="text-xl" />
      </div>
    </NuxtLink>

    <button
      @click="handleLogout"
      :disabled="isLoggingOut"
      class="bg-gray-200 rounded-full p-2 flex items-center justify-center hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Icon name="mdi:logout" class="text-xl" />
    </button>
  </header>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import useSupabaseAuth from "~/composables/useSupabaseAuth";

defineEmits(['toggle-sidebar']);

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

  await router.push("/login");
  isLoggingOut.value = false;
};
</script>