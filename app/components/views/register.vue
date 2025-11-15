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
        <div>
          <label for="role" class="block text-sm font-medium text-white mb-2"
            >I am a...</label
          >
          <select
            v-model="formData.role"
            id="role"
            name="role"
            required
            class="mt-1 p-2 bg-white border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Select your role</option>
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
        </div>

        <!-- Full Name -->
        <div>
          <label for="name" class="block text-sm font-medium text-white"
            >Full Name</label
          >
          <input
            v-model="formData.name"
            type="text"
            id="name"
            name="name"
            required
            placeholder="John Doe"
            class="mt-1 p-2 bg-white border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500"
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
            class="mt-1 p-2 bg-white border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <!-- Username -->
        <div>
          <label for="username" class="block text-sm font-medium text-white"
            >Username</label
          >
          <input
            v-model="formData.username"
            type="text"
            id="username"
            name="username"
            required
            placeholder="johndoe"
            class="mt-1 p-2 bg-white border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500"
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
            class="mt-1 p-2 bg-white border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <!-- Medical School Year (Only for Students) -->
        <div v-if="formData.role === 'student'">
          <label for="msyear" class="block text-sm font-medium text-white"
            >Medical School Year</label
          >
          <select
            v-model="formData.msyear"
            id="msyear"
            name="msyear"
            :required="formData.role === 'student'"
            class="mt-1 p-2 bg-white border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Select year</option>
            <option value="1">Year 1 (MS1)</option>
            <option value="2">Year 2 (MS2)</option>
            <option value="3">Year 3 (MS3)</option>
            <option value="4">Year 4 (MS4)</option>
          </select>
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
            class="mt-1 p-2 bg-white border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500"
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
            class="mt-1 p-2 bg-white border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500"
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

const formData = reactive({
  role: "",
  name: "",
  email: "",
  username: "",
  school: "",
  msyear: "",
  classroomCode: "",
  password: "",
  confirmPassword: "",
});

const errorMessage = ref("");
const isSubmitting = ref(false);

const handleSubmit = async () => {
  errorMessage.value = "";

  // Validation
  if (formData.password !== formData.confirmPassword) {
    errorMessage.value = "Passwords do not match";
    return;
  }

  if (formData.password.length < 8) {
    errorMessage.value = "Password must be at least 8 characters long";
    return;
  }

  if (formData.role === "student" && !formData.msyear) {
    errorMessage.value = "Please select your medical school year";
    return;
  }

  isSubmitting.value = true;

  try {
    // TODO: Implement actual registration logic with Supabase Auth
    console.log("Registration data:", {
      role: formData.role,
      name: formData.name,
      email: formData.email,
      username: formData.username,
      school: formData.school,
      msyear: formData.role === "student" ? parseInt(formData.msyear) : null,
      classroomCode: formData.classroomCode || null,
    });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Redirect to login or dashboard after successful registration
    // navigateTo('/login');

    alert(
      "Registration successful! Please check your email to verify your account."
    );
  } catch (error) {
    console.error("Registration error:", error);
    errorMessage.value = "Registration failed. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
/* Additional styles if needed */
</style>
