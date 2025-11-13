<template>
    <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[rgb(175,103,240)] to-white">
        <!-- Icon and Title -->
    <div class="flex items-center space-x-3 mb-8">
      <div class="p-4 bg-white rounded-full shadow-lg">
        <Icon name="healthicons:autoimmune-disease-outline" class="text-6xl" />
      </div>
      <h1 class="text-4xl font-bold text-white drop-shadow-lg">Login to DiseaseQuest</h1>
    </div>

    <!-- Login Form -->
    <div class="w-full max-w-md">
      <form class="space-y-4">
        <div>
          <label for="username" class="block text-sm font-medium text-white">Username</label>
          <input type="text" id="username" name="username" required class="mt-1 p-2 bg-white border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500">
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-white">Password</label>
          <input type="password" id="password" name="password" required class="mt-1 p-2 bg-white border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500">
        </div>
        <button type="submit" class="w-full bg-purple-600 text-white p-2 rounded-md hover:bg-purple-700 transition-colors">Login</button>
      </form>
    </div>
    </div>
</template>
    
<script setup>
    
</script>
    
<style scoped>
    
</style>
