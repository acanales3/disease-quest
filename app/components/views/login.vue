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

        <div v-if="error" class="text-red-500 text-sm bg-red-50 p-3 rounded-md">
          {{ error }}
        </div>

        <button
          type="submit"
          class="w-full bg-purple-600 text-white p-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isLoading"
        >
          {{ isLoading ? "Logging in..." : "Login" }}
        </button>
      </form>

      <!-- Test Accounts Info (REMOVE IN PRODUCTION) -->
      <div class="mt-6 p-4 bg-white/20 rounded-md text-white text-sm">
        <p class="font-semibold mb-2">Test Accounts:</p>
        <ul class="space-y-1 text-xs">
          <li>Admin: fakeadmin@gmail.com</li>
          <li>Instructor: fakeinstructor@gmail.com</li>
          <li>Student: fakestudent@gmail.com</li>
          <li>Password: password</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import useSupabaseAuth from "~/composables/useSupabaseAuth";

definePageMeta({
  layout: false, // No layout for login page
});

const email = ref("");
const password = ref("");
const error = ref("");
const isLoading = ref(false);

const router = useRouter();
const { login, user, fetchCustomUser } = useSupabaseAuth();

// Check if already logged in on mount
onMounted(async () => {
  if (user.value) {
    console.log("User already logged in, fetching profile...");
    const profile = await fetchCustomUser();

    if (profile?.role) {
      console.log("Already logged in, redirecting to dashboard");
      router.push(`/${profile.role.toLowerCase()}/dashboard`);
    }
  }
});

const handleLogin = async () => {
  error.value = "";
  isLoading.value = true;

  try {
    const { error: loginErr, customUser: profile } = await login(
      email.value,
      password.value,
    );

    if (loginErr) {
      error.value = loginErr.message;
      isLoading.value = false;
      return;
    }

    if (!profile?.role) {
      error.value = "No profile found for user. Please contact support.";
      isLoading.value = false;
      return;
    }

    console.log("Login successful:", {
      userId: profile.id,
      role: profile.role,
      email: profile.email,
    });

    // Redirect by role
    const targetPath = `/${profile.role.toLowerCase()}/dashboard`;
    console.log("Redirecting to:", targetPath);

    await router.push(targetPath);
  } catch (err) {
    console.error("Login error:", err);
    error.value = "An unexpected error occurred. Please try again.";
  } finally {
    isLoading.value = false;
  }
};
</script>
