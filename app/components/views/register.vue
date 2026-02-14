<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[rgb(175,103,240)] to-white py-8"
  >
    <div class="flex items-center space-x-3 mb-8">
      <div class="p-4 bg-white rounded-full shadow-lg">
        <Icon name="healthicons:autoimmune-disease-outline" class="text-6xl" />
      </div>
      <h1 class="text-4xl font-bold text-white drop-shadow-lg">
        Register for DiseaseQuest
      </h1>
    </div>

    <div class="w-full max-w-md">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- First Name -->
        <div>
          <label for="firstName" class="block text-sm font-medium text-white"
            >First Name</label
          >
          <input
            v-model="formData.firstName"
            type="text"
            id="firstName"
            name="firstName"
            required
            placeholder="John"
            class="mt-1 p-2 bg-white border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500 placeholder:text-gray-400"
          />
        </div>

        <!-- Last Name -->
        <div>
          <label for="lastName" class="block text-sm font-medium text-white"
            >Last Name</label
          >
          <input
            v-model="formData.lastName"
            type="text"
            id="lastName"
            name="lastName"
            required
            placeholder="Doe"
            class="mt-1 p-2 bg-white border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500 placeholder:text-gray-400"
          />
        </div>

        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-white"
            >Email</label
          >
          <input
            v-model="formData.email"
            type="email"
            id="email"
            name="email"
            required
            placeholder="john.doe@university.edu"
            class="mt-1 p-2 bg-white border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500 placeholder:text-gray-400"
          />
        </div>

        <!-- School/Institution -->
        <div>
          <label for="school" class="block text-sm font-medium text-white"
            >School/Institution</label
          >
          <input
            v-model="formData.school"
            type="text"
            id="school"
            name="school"
            required
            placeholder="Texas Christian University"
            class="mt-1 p-2 bg-white border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500 placeholder:text-gray-400"
          />
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-white"
            >Password</label
          >
          <input
            v-model="formData.password"
            type="password"
            id="password"
            name="password"
            required
            placeholder="••••••••"
            minlength="8"
            class="mt-1 p-2 bg-white border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500 placeholder:text-gray-400"
          />
          <p class="text-xs text-white mt-1">Minimum 8 characters</p>
        </div>

        <!-- Confirm Password -->
        <div>
          <label
            for="confirmPassword"
            class="block text-sm font-medium text-white"
            >Confirm Password</label
          >
          <input
            v-model="formData.confirmPassword"
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
            placeholder="••••••••"
            minlength="8"
            class="mt-1 p-2 bg-white border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500 placeholder:text-gray-400"
          />
        </div>

        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="text-red-600 bg-red-100 p-3 rounded-md text-sm"
        >
          {{ errorMessage }}
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full bg-purple-600 text-white p-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? "Creating Account..." : "Create Account" }}
        </button>

        <!-- Login Link -->
        <div class="text-center mt-4">
          <p class="text-white text-sm">
            Already have an account?
            <NuxtLink
              to="/login"
              class="font-medium underline hover:text-purple-200"
            >
              Login here
            </NuxtLink>
          </p>
        </div>
      </form>
    </div>
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

const handleSubmit = async () => {
  errorMessage.value = "";

  // Validate passwords
  if (formData.password !== formData.confirmPassword) {
    errorMessage.value = "Passwords do not match";
    return;
  }
  if (formData.password.length < 8) {
    errorMessage.value = "Password must be at least 8 characters long";
    return;
  }

  isSubmitting.value = true;

  try {
    // Supabase sign up with metadata
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

    alert(
      "Registration successful! Please check your email to verify your account.",
    );

    router.push("/login");
  } catch (err: any) {
    console.error(err);
    errorMessage.value =
      err.message || "Registration failed. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
/* Optional additional styles */
</style>
