<template>
  <div class="min-h-screen flex">
    <!-- Left Panel -->
    <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-14" style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 30%, #c4b5fd 70%, #7c3aed 100%)">
      <div class="relative z-10">
        <span class="text-gray-900 text-lg font-semibold tracking-tight">DiseaseQuest</span>
      </div>

      <div class="relative z-10 max-w-sm">
        <h1 class="text-[2.5rem] font-semibold text-gray-900 leading-[1.2] tracking-tight mb-4">
          Master clinical reasoning through practice.
        </h1>
        <p class="text-gray-600 text-[15px] leading-relaxed">
          Build diagnostic confidence with realistic patient cases designed for medical education.
        </p>
      </div>

      <div class="relative z-10">
        <p class="text-gray-500 text-xs">&copy; {{ new Date().getFullYear() }} DiseaseQuest</p>
      </div>
    </div>

    <!-- Right Panel — Form -->
    <div class="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-20 bg-white">
      <div class="w-full max-w-[420px] mx-auto">
        <!-- Mobile logo -->
        <div class="mb-10 lg:hidden">
          <span class="text-gray-900 text-lg font-semibold tracking-tight">DiseaseQuest</span>
        </div>

        <!-- Back link -->
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to home
        </NuxtLink>

        <div class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 tracking-tight">Welcome back</h2>
          <p class="text-gray-500 text-sm mt-1.5">Sign in to your account to continue.</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              v-model="email"
              type="email"
              id="email"
              required
              autocomplete="email"
              placeholder="you@university.edu"
              class="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4d1979]/20 focus:border-[#4d1979] transition-colors"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="password" class="block text-sm font-medium text-gray-700">
                Password
              </label>
            </div>
            <input
              v-model="password"
              type="password"
              id="password"
              required
              autocomplete="current-password"
              placeholder="Enter your password"
              class="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4d1979]/20 focus:border-[#4d1979] transition-colors"
            />
          </div>

          <div
            v-if="error"
            class="flex items-start gap-2.5 text-sm text-red-600 bg-red-50 border border-red-100 px-3.5 py-3 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full h-11 bg-[#4d1979] text-white text-sm font-medium rounded-lg hover:bg-[#3d1361] active:bg-[#2f0f4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg
              v-if="isLoading"
              class="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ isLoading ? "Signing in..." : "Sign in" }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-500">
            Don't have an account?
            <NuxtLink
              to="/register"
              class="font-medium text-[#4d1979] hover:text-[#3d1361] transition-colors"
            >
              Create one
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import useSupabaseAuth from "~/composables/useSupabaseAuth";

definePageMeta({
  layout: false,
});

const email = ref("");
const password = ref("");
const error = ref("");
const isLoading = ref(false);

const router = useRouter();
const { login, user, fetchCustomUser } = useSupabaseAuth();

onMounted(async () => {
  if (user.value) {
    const profile = await fetchCustomUser();

    if (profile?.role) {
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

    const targetPath = `/${profile.role.toLowerCase()}/dashboard`;
    await router.push(targetPath);
  } catch (err) {
    console.error("Login error:", err);
    error.value = "An unexpected error occurred. Please try again.";
  } finally {
    isLoading.value = false;
  }
};
</script>
