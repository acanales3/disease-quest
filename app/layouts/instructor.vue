<script setup lang="ts">
import TopNavBar from '~/components/NavBars/TopNavBar.vue';
import { ref } from 'vue';

const sidebarOpen = ref(false);
</script>

<template>
  <div class="flex min-h-screen bg-[#f8f7ff]">

    <!-- Mobile backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-black/30 z-20 lg:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- Mobile sidebar -->
    <Transition
      enter-active-class="transition-transform duration-200 ease-out"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <aside
        v-show="sidebarOpen"
        class="fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm lg:hidden"
      >
        <div class="flex items-center justify-between gap-2.5 px-6 py-5 border-b border-gray-100">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-[#4d1979] flex items-center justify-center shrink-0">
              <Icon name="healthicons:autoimmune-disease-outline" class="text-white text-lg" />
            </div>
            <span class="text-[15px] font-semibold text-gray-900 tracking-tight">DiseaseQuest</span>
          </div>
          <button @click="sidebarOpen = false" class="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <NavBarsInstructorNavBar class="flex-1 overflow-y-auto py-4 px-3" @click="sidebarOpen = false" />
      </aside>
    </Transition>

    <!-- Desktop sidebar -->
    <aside class="hidden lg:flex w-64 min-h-screen bg-white border-r border-gray-100 flex-col shrink-0 shadow-sm">
      <div class="flex items-center gap-2.5 px-6 py-5 border-b border-gray-100">
        <div class="w-8 h-8 rounded-lg bg-[#4d1979] flex items-center justify-center shrink-0">
          <Icon name="healthicons:autoimmune-disease-outline" class="text-white text-lg" />
        </div>
        <span class="text-[15px] font-semibold text-gray-900 tracking-tight">DiseaseQuest</span>
      </div>
      <NavBarsInstructorNavBar class="flex-1 overflow-y-auto py-4 px-3" />
    </aside>

    <!-- Main -->
    <div class="flex flex-col flex-1 min-w-0">
      <TopNavBar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="flex-1 p-6 min-w-0">
        <slot />
      </main>
    </div>

  </div>
</template>