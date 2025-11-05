<!-- app/layouts/admin.vue -->
<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-blue-600 text-white p-4">
      <NavBarsStudentNavBar />
    </header>

    <main class="flex-1 p-6">
      <slot /> <!-- Page content renders here -->
    </main>

    <footer class="bg-gray-100 text-center py-4">
      <p>© DiseaseQuest</p>
    </footer>
  </div>
</template>
