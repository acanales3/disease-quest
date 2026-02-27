<script setup lang="ts">
import TopNavBar from '~/components/NavBars/TopNavBar.vue'
import { ref, provide } from 'vue'

const isOpen = ref(false)
provide('navIsOpen', isOpen)
</script>

<template>
  <div class="flex flex-col min-h-screen p-4 bg-gray-100">
    <div class="flex flex-1 gap-4 min-w-0">

      <!-- Desktop sidebar -->
      <aside class="hidden md:flex w-64 bg-[#AF67F0] text-white flex-col rounded-xl shrink-0">
        <div class="flex items-center gap-4 p-4">
          <Icon name="healthicons:autoimmune-disease-outline" class="text-4xl" />
          <span class="text-2xl font-bold text-center">DiseaseQuest</span>
        </div>

        <NavBarsAdminNavBar class="flex-1 overflow-y-auto p-4" />
      </aside>

      <!-- Mobile sidebar -->
      <div class="md:hidden">
        <NavBarsAdminNavBar />
      </div>

      <!-- Main content -->
      <div class="flex flex-col flex-1 gap-4 min-w-0">
        <div class="pl-12 md:pl-0">
          <TopNavBar />
        </div>

        <main class="flex-1 p-6 min-w-0">
          <slot />
        </main>
      </div>

    </div>
  </div>
</template>