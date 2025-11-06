<template>
  <nav class="flex flex-col space-y-2 p-4">
    <NuxtLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      exact
      class="flex items-center gap-2 px-3 py-2 rounded hover:bg-white transition hover:text-black"
      active-class="bg-white text-black"
    >
      <Icon :name="link.icon" class="text-xl"/>
      <span>{{ link.label }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup>
const links = [
  { label: 'Dashboard', to: '/student/dashboard', icon: 'iconamoon:home-light' },
  { label: 'Classrooms', to: '/student/classrooms', icon: 'simple-icons:googleclassroom' },
  { label: 'Cases', to: '/student/cases', icon: 'si:book-line' },
  { label: 'Analytics', to: '/student/analytics', icon: 'uim:analytics' },
  { label: 'Leaderboard', to: '/student/leaderboard', icon: 'material-symbols:social-leaderboard-outline-rounded' },
]
</script>

