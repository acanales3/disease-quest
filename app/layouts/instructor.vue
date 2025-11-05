<template>
  <div class="flex flex-col min-h-screen">
    <!-- Main area: sidebar + content -->
    <div class="flex flex-1">
      <!-- Sidebar -->
      <aside class="w-64 bg-blue-600 text-white flex flex-col">
        <NavBarsAdminNavBar class="flex-1 overflow-y-auto p-4" />
      </aside>

      <!-- Main content -->
      <main class="flex-1 p-6 flex items-center justify-center bg-gray-100">
        <slot /> <!-- Page content renders here -->
      </main>
    </div>
  </div>
</template>
