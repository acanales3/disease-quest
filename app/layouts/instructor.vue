<template>
  <div class="flex flex-col min-h-screen p-4 bg-gray-100">
    <!-- Main area: sidebar + content -->
    <div class="flex flex-1 gap-4">
      <!-- Sidebar -->
      <aside class="w-64 bg-[#AF67F0] text-white flex flex-col rounded-xl">
        <div class="flex items-center gap-4 p-4">
          <Icon name="healthicons:autoimmune-disease-outline" class="text-4xl" />
          <span class="text-2xl font-bold text-center">
            DiseaseQuest
          </span> 
        </div>

        <NavBarsInstructorNavBar class="flex-1 overflow-y-auto p-4" />
      </aside>

      <!-- Main content -->
      <!-- Main: header + page view -->
      <div class="flex flex-col flex-1 gap-4">
        <!-- Header -->
        <header class=" p-4 flex justify-end">
          <div class="bg-gray-200 rounded-full p-2 flex items-center justify-center">
            <Icon name="mdi-light:settings" class="text-xl" />
          </div>
        </header>

        <!-- Page view -->
        <main class="flex-1 p-6 flex items-center justify-center">
          <slot /> <!-- Page content renders here -->
        </main>
      </div>
    </div>
  </div>
</template>
