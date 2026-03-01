<template>
  <div class="min-h-screen flex">
    <!-- Left Panel -->
    <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-14" style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 30%, #c4b5fd 70%, #7c3aed 100%)">
      <div class="relative z-10">
        <span class="text-gray-900 text-lg font-semibold tracking-tight">DiseaseQuest</span>
      </div>

      <div class="relative z-10 max-w-sm">
        <h1 class="text-[2.5rem] font-semibold text-gray-900 leading-[1.2] tracking-tight mb-4">
          Start your clinical learning journey today.
        </h1>
        <p class="text-gray-600 text-[15px] leading-relaxed">
          Join students sharpening their diagnostic skills with interactive patient simulations.
        </p>
      </div>

      <div class="relative z-10">
        <p class="text-gray-500 text-xs">&copy; {{ new Date().getFullYear() }} DiseaseQuest</p>
      </div>
    </div>

    <!-- Right Panel — Form -->
    <div class="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 bg-white">
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
          <h2 class="text-2xl font-semibold text-gray-900 tracking-tight">Create your account</h2>
          <p class="text-gray-500 text-sm mt-1.5">Get started with DiseaseQuest in seconds.</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
              <input
                v-model="formData.firstName"
                type="text"
                required
                autocomplete="given-name"
                placeholder="John"
                class="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4d1979]/20 focus:border-[#4d1979] transition-colors"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
              <input
                v-model="formData.lastName"
                type="text"
                required
                autocomplete="family-name"
                placeholder="Doe"
                class="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4d1979]/20 focus:border-[#4d1979] transition-colors"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <input
              v-model="formData.email"
              type="email"
              required
              autocomplete="email"
              placeholder="you@university.edu"
              class="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4d1979]/20 focus:border-[#4d1979] transition-colors"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">School / Institution</label>
            <input
              v-model="formData.school"
              type="text"
              required
              placeholder="Texas Christian University"
              class="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4d1979]/20 focus:border-[#4d1979] transition-colors"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              v-model="formData.password"
              type="password"
              minlength="8"
              required
              autocomplete="new-password"
              placeholder="Minimum 8 characters"
              class="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4d1979]/20 focus:border-[#4d1979] transition-colors"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
            <input
              v-model="formData.confirmPassword"
              type="password"
              minlength="8"
              required
              autocomplete="new-password"
              placeholder="Re-enter your password"
              class="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4d1979]/20 focus:border-[#4d1979] transition-colors"
            />
          </div>

          <div
            v-if="errorMessage"
            class="flex items-start gap-2.5 text-sm text-red-600 bg-red-50 border border-red-100 px-3.5 py-3 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full h-11 bg-[#4d1979] text-white text-sm font-medium rounded-lg hover:bg-[#3d1361] active:bg-[#2f0f4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            <svg
              v-if="isSubmitting"
              class="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ isSubmitting ? "Creating account..." : "Create account" }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-500">
            Already have an account?
            <NuxtLink
              to="/login"
              class="font-medium text-[#4d1979] hover:text-[#3d1361] transition-colors"
            >
              Sign in
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showSuccessModal"
          class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div class="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
            <div class="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Account created</h3>
            <p class="text-gray-500 text-sm mb-6 leading-relaxed">
              Your account has been created successfully. You can now sign in with your credentials.
            </p>
            <button
              @click="goToLogin"
              class="w-full h-11 bg-[#4d1979] text-white text-sm font-medium rounded-lg hover:bg-[#3d1361] transition-colors"
            >
              Continue to sign in
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useSupabaseClient } from "#imports";
import { useRouter } from "vue-router";

const supabase = useSupabaseClient();
const router = useRouter();

const formData = reactive({
  firstName: "",
  lastName: "",
  email: "",
  school: "",
  password: "",
  confirmPassword: "",
});

const errorMessage = ref("");
const isSubmitting = ref(false);
const showSuccessModal = ref(false);

const goToLogin = () => {
  router.push("/login");
};

const handleSubmit = async () => {
  errorMessage.value = "";

  if (formData.password !== formData.confirmPassword) {
    errorMessage.value = "Passwords do not match.";
    return;
  }

  if (formData.password.length < 8) {
    errorMessage.value = "Password must be at least 8 characters long.";
    return;
  }

  isSubmitting.value = true;

  try {
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.firstName || "Unknown",
          last_name: formData.lastName || "Unknown",
          school: formData.school || "Unknown",
        },
      },
    });

    if (error) throw error;

    showSuccessModal.value = true;
  } catch (err: any) {
    console.error(err);
    errorMessage.value =
      err.message || "Registration failed. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
};
</script>
