<script setup lang="ts">
import TopNavBar from '~/components/NavBars/TopNavBar.vue';
import { ref } from 'vue';

const sidebarOpen = ref(false);
</script>

<template>
  <div class="flex min-h-screen bg-[#f9fafb]">

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
        class="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-20 lg:hidden"
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
        class="fixed inset-y-0 left-0 z-30 w-60 bg-white border-r border-gray-200/80 flex flex-col lg:hidden"
      >
        <div class="flex items-center justify-between gap-2 px-5 h-16 border-b border-gray-100 shrink-0">
          <div class="flex items-center">
            <span class="text-[19px] font-semibold tracking-tight text-gray-900">
              Disease<span class="text-[#4d1979]">Quest</span>
            </span>
          </div>
          <button @click="sidebarOpen = false" class="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <Icon name="lucide:x" size="16" />
          </button>
        </div>
        <NavBarsStudentNavBar class="flex-1 overflow-y-auto py-3 px-3" @click="sidebarOpen = false" />
      </aside>
    </Transition>

    <!-- Desktop sidebar -->
    <aside class="hidden lg:flex w-60 min-h-screen bg-white border-r border-gray-200/80 flex-col shrink-0">
      <div class="flex items-center px-5 h-16 border-b border-gray-100 shrink-0">
        <span class="text-[19px] font-semibold tracking-tight text-gray-900">
          Disease<span class="text-[#4d1979]">Quest</span>
        </span>
      </div>
      <NavBarsStudentNavBar class="flex-1 overflow-y-auto py-3 px-3" />
    </aside>

    <!-- Main -->
    <div class="flex flex-col flex-1 min-w-0">
      <TopNavBar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="flex-1 p-6 lg:p-8 min-w-0">
        <slot />
      </main>
    </div>

  </div>
</template>