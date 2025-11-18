<script setup lang="ts">
import TopNavBar from '~/components/NavBars/TopNavBar.vue';

</script>

<template>
  <div class="flex flex-col min-h-screen p-4 bg-gray-100">
    <div class="flex flex-1 gap-4 min-w-0">
      
      <!-- Sidebar -->
      <aside class="w-64 bg-[#AF67F0] text-white flex flex-col rounded-xl">
        <div class="flex items-center gap-4 p-4">
          <Icon name="healthicons:autoimmune-disease-outline" class="text-4xl" />
          <span class="text-2xl font-bold text-center">
            DiseaseQuest
          </span> 
        </div>

        <NavBarsAdminNavBar class="flex-1 overflow-y-auto p-4" />
      </aside>

      <!-- Main: header + page view -->
      <div class="flex flex-col flex-1 gap-4 min-w-0">
        <!-- Header -->
        <TopNavBar />

        <!-- Page view -->
        <main class="flex-1 p-6 min-w-0">
          <slot /> <!-- Page content renders here -->
        </main>
      </div>
    </div>
  </div>
</template>
