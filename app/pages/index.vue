<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[rgb(175,103,240)] to-white">
    <!-- Icon and Title -->
    <div class="flex items-center space-x-3 mb-8">
      <div class="p-4 bg-white rounded-full shadow-lg">
        <Icon name="healthicons:autoimmune-disease-outline" class="text-6xl" />
      </div>
      <h1 class="text-4xl font-bold text-white drop-shadow-lg">Welcome to DiseaseQuest</h1>
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

<script setup>
</script>

<style scoped>
</style>
