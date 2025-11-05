<template>
  <div class="flex flex-col min-h-screen p-4 bg-gray-100">
    <!-- Main area: sidebar + content -->
    <div class="flex flex-1 gap-4">
      <!-- Sidebar -->
      <aside class="w-64 bg-[#AF67F0] text-white flex flex-col border-2 rounded-xl shadow-md">
        <h1 class="text-2xl font-bold text-center py-4">
          DiseaseQuest
        </h1> 
        <NavBarsStudentNavBar class="flex-1 overflow-y-auto p-4" />
      </aside>

      <!-- Main content -->
      <main class="flex-1 p-6 flex items-center justify-center bg-gray-100">
        <slot /> <!-- Page content renders here -->
      </main>
    </div>
  </div>
</template>
