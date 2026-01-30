<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[rgb(175,103,240)] to-white"
  >
    <!-- Icon and Title -->
    <div class="flex items-center space-x-3 mb-8">
      <div class="p-4 bg-white rounded-full shadow-lg">
        <Icon name="healthicons:autoimmune-disease-outline" class="text-6xl" />
      </div>
      <h1 class="text-4xl font-bold text-white drop-shadow-lg">
        Login to DiseaseQuest
      </h1>
    </div>

    <!-- Login Form -->
    <div class="w-full max-w-md">
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-white"
            >Email</label
          >
          <input
            v-model="email"
            type="email"
            id="email"
            required
            class="mt-1 p-2 bg-white border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-white"
            >Password</label
          >
          <input
            v-model="password"
            type="password"
            id="password"
            required
            class="mt-1 p-2 bg-white border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div v-if="error" class="text-red-500 text-sm">
          {{ error }}
        </div>

        <button
          type="submit"
          class="w-full bg-purple-600 text-white p-2 rounded-md hover:bg-purple-700 transition-colors"
          :disabled="isLoading"
        >
          {{ isLoading ? "Logging in..." : "Login" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { useRouter } from "vue-router";
import useSupabaseAuth from "~/composables/useSupabaseAuth";

const email = ref("");
const password = ref("");
const error = ref("");
const isLoading = ref(false);

const router = useRouter();

// our composable
const { login, customUser, user } = useSupabaseAuth();

// auto-redirect if already logged in AND we have a custom user
watchEffect(() => {
  if (user.value && customUser.value) {
    // Use role instead of token
    if (customUser.value.role) {
      router.push(`/${customUser.value.role.toLowerCase()}/dashboard`);
    }
  }
});

const handleLogin = async () => {
  error.value = "";
  isLoading.value = true;

  const { error: loginErr, customUser: profile } = await login(
    email.value,
    password.value,
  );

  if (loginErr) {
    error.value = loginErr.message;
    isLoading.value = false;
    return;
  }

  // Check for role instead of token
  if (!profile?.role) {
    error.value = "No profile found for user.";
    isLoading.value = false;
    return;
  }

  console.log("Logged in:", profile);

  // Redirect by role (ADMIN -> /admin/dashboard, STUDENT -> /student/dashboard)
  router.push(`/${profile.role.toLowerCase()}/dashboard`);

  isLoading.value = false;
};
</script>
