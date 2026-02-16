<template>
  <div
    class="relative min-h-screen flex flex-col items-center justify-start pt-16 bg-gradient-to-b from-[rgb(175,103,240)] to-white py-8"
  >
    <!-- BACK BUTTON -->
    <div class="absolute top-10 left-10 flex justify-start">
      <BackwardButton route="/"/>
    </div>

    <!-- Header -->
    <div class="flex items-center space-x-3 mb-8">
      <div class="p-4 bg-white rounded-full shadow-lg">
        <Icon name="healthicons:autoimmune-disease-outline" class="text-6xl" />
      </div>
      <h1 class="text-4xl font-bold text-white drop-shadow-lg">
        Register for DiseaseQuest
      </h1>
    </div>

    <!-- Form -->
    <div class="w-full max-w-md">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- First Name -->
        <div>
          <label class="block text-sm font-medium text-white">First Name</label>
          <input
            v-model="formData.firstName"
            type="text"
            required
            placeholder="John"
            class="mt-1 p-2 bg-white border border-gray-300 rounded-md w-full"
          />
        </div>

        <!-- Last Name -->
        <div>
          <label class="block text-sm font-medium text-white">Last Name</label>
          <input
            v-model="formData.lastName"
            type="text"
            required
            placeholder="Doe"
            class="mt-1 p-2 bg-white border border-gray-300 rounded-md w-full"
          />
        </div>

        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-white">Email</label>
          <input
            v-model="formData.email"
            type="email"
            required
            placeholder="john.doe@university.edu"
            class="mt-1 p-2 bg-white border border-gray-300 rounded-md w-full"
          />
        </div>

        <!-- School -->
        <div>
          <label class="block text-sm font-medium text-white">
            School/Institution
          </label>
          <input
            v-model="formData.school"
            type="text"
            required
            placeholder="Texas Christian University"
            class="mt-1 p-2 bg-white border border-gray-300 rounded-md w-full"
          />
        </div>

        <!-- Password -->
        <div>
          <label class="block text-sm font-medium text-white">Password</label>
          <input
            v-model="formData.password"
            type="password"
            minlength="8"
            required
            placeholder="••••••••"
            class="mt-1 p-2 bg-white border border-gray-300 rounded-md w-full"
          />
          <p class="text-xs text-white mt-1">Minimum 8 characters</p>
        </div>

        <!-- Confirm Password -->
        <div>
          <label class="block text-sm font-medium text-white">
            Confirm Password
          </label>
          <input
            v-model="formData.confirmPassword"
            type="password"
            minlength="8"
            required
            placeholder="••••••••"
            class="mt-1 p-2 bg-white border border-gray-300 rounded-md w-full"
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
          class="w-full bg-purple-600 text-white p-2 rounded-md hover:bg-purple-700 transition disabled:opacity-50"
        >
          {{ isSubmitting ? "Creating Account..." : "Create Account" }}
        </button>

        <!-- Login Link -->
        <div class="text-center mt-4">
          <p class="text-gray-800 text-sm">
            Already have an account?
            <NuxtLink
              to="/login"
              class="font-medium underline text-purple-700 hover:text-purple-900"
            >
              Login here
            </NuxtLink>
          </p>
        </div>
      </form>
    </div>

    <!-- SUCCESS MODAL -->
    <div
      v-if="showSuccessModal"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div
        class="bg-white p-6 rounded-xl shadow-xl max-w-sm text-center space-y-4"
      >
        <h2 class="text-xl font-bold text-green-600">
          Registration Successful!
        </h2>

        <p class="text-gray-600">
          Your account was created successfully. Please log in.
        </p>

        <button
          @click="goToLogin"
          class="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700"
        >
          Go to Login
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useSupabaseClient } from "#imports";
import { useRouter } from "vue-router";
import BackwardButton from "~/components/BackwardButton/BackwardButton.vue";

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
    errorMessage.value = "Passwords do not match";
    return;
  }

  if (formData.password.length < 8) {
    errorMessage.value = "Password must be at least 8 characters long";
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

<style scoped>
/* optional */
</style>
