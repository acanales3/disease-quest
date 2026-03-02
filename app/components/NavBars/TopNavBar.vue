<template>
  <header class="h-16 border-b border-gray-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 flex items-center justify-between px-4 lg:px-8 shrink-0">
    <div class="flex items-center gap-3 min-w-0">
      <button
        @click="$emit('toggle-sidebar')"
        class="lg:hidden w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
      >
        <Icon name="lucide:menu" class="text-lg" />
      </button>

      <div class="hidden sm:block min-w-0">
        <p class="text-[11px] font-medium uppercase tracking-widest text-[#4d1979]">Workspace</p>
        <p class="text-sm font-semibold text-gray-900 truncate">{{ pageTitle }}</p>
      </div>
    </div>

    <div class="flex items-center gap-2.5">
      <NuxtLink
        to="/settings"
        class="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center text-gray-500 hover:bg-[#f5f3ff] hover:text-[#4d1979] transition-colors"
      >
        <Icon name="lucide:settings" class="text-[17px]" />
      </NuxtLink>

      <button
        @click="handleLogout"
        :disabled="isLoggingOut"
        class="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Icon name="lucide:log-out" class="text-[17px]" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import useSupabaseAuth from "~/composables/useSupabaseAuth";

defineEmits(['toggle-sidebar']);

const route = useRoute();
const router = useRouter();
const { logout } = useSupabaseAuth();
const isLoggingOut = ref(false);

const pageTitle = computed(() => {
  const path = route.path;

  if (path.startsWith('/admin/students')) return 'Students';
  if (path.startsWith('/admin/instructors')) return 'Instructors';
  if (path.startsWith('/admin/classrooms')) return 'Classrooms';
  if (path.startsWith('/admin/cases')) return 'Cases';
  if (path.startsWith('/admin/admins')) return 'Administrators';
  if (path.startsWith('/admin/analytics')) return 'Analytics';
  if (path.startsWith('/admin/leaderboard')) return 'Leaderboard';
  if (path.startsWith('/student/dashboard')) return 'Dashboard';
  if (path.startsWith('/student/classrooms')) return 'Classrooms';
  if (path.startsWith('/student/cases')) return 'Cases';
  if (path.startsWith('/student/analytics')) return 'Analytics';
  if (path.startsWith('/student/leaderboard')) return 'Leaderboard';
  if (path.startsWith('/instructor/dashboard')) return 'Dashboard';
  if (path.startsWith('/instructor/classrooms')) return 'Classrooms';
  if (path.startsWith('/instructor/students')) return 'Students';
  if (path.startsWith('/instructor/cases')) return 'Cases';
  if (path.startsWith('/instructor/analytics')) return 'Analytics';
  if (path.startsWith('/instructor/leaderboard')) return 'Leaderboard';
  if (path.startsWith('/settings')) return 'Account Settings';

  return 'Dashboard';
});

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
