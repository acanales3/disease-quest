<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center bg-linear-to-b from-[rgb(175,103,240)] to-white"
  >
    <!-- Icon and Title -->
    <div class="flex items-center space-x-3 mb-8">
      <div class="p-4 bg-white rounded-full shadow-lg">
        <Icon name="healthicons:autoimmune-disease-outline" class="text-6xl" />
      </div>
      <h1 class="text-4xl font-bold text-white drop-shadow-lg">
        Welcome to DiseaseQuest
      </h1>
    </div>

    <!-- Buttons -->
    <div class="flex space-x-6">
      <NuxtLink
        to="/login"
        class="px-8 py-3 bg-white text-[#AF67F0] font-semibold rounded-2xl shadow-md hover:bg-[#f2e6ff] transition-all duration-300"
      >
        Login
      </NuxtLink>
      <NuxtLink
        to="/register"
        class="px-8 py-3 bg-[#AF67F0] text-white font-semibold rounded-2xl shadow-md hover:bg-[#9c4be8] transition-all duration-300"
      >
        Register
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import useSupabaseAuth from "~/composables/useSupabaseAuth";

const email = ref("");
const password = ref("");
const error = ref("");
const isLoading = ref(false);

const router = useRouter();
const supabase = useSupabaseClient();
const { login } = useSupabaseAuth();

// Check if already logged in on mount
onMounted(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    console.log("User already logged in, fetching profile...");

    // Get user profile to determine role
    const { getUserProfile } = useUsers();
    const { data: profile } = await getUserProfile(session.user.id);

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

    // Use window.location for a hard redirect to ensure middleware runs
    window.location.href = targetPath;
  } catch (err) {
    console.error("Login error:", err);
    error.value = "An unexpected error occurred. Please try again.";
    isLoading.value = false;
  }
};
</script>
