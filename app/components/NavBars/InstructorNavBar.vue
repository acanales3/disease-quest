<template>
  <nav class="flex flex-col space-y-2 p-4">
    <NuxtLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      exact
      class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-[#f5f3ff] hover:text-[#4d1979] transition-colors"
      active-class="bg-[#ede9fe] text-[#4d1979] font-semibold"
    >
      <Icon :name="link.icon" class="text-xl shrink-0" />
      <span>{{ link.label }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup>
const links = [
  { label: 'Dashboard', to: '/instructor/dashboard', icon: 'iconamoon:home-light' },
  { label: 'Students', to: '/instructor/students', icon: 'hugeicons:students' },
  { label: 'Classrooms', to: '/instructor/classrooms', icon: 'lucide:layout-grid' },
  { label: 'Cases', to: '/instructor/cases', icon: 'si:book-line' },
  { label: 'Analytics', to: '/instructor/analytics', icon: 'uim:analytics' },
  { label: 'Leaderboard', to: '/instructor/leaderboard', icon: 'material-symbols:social-leaderboard-outline-rounded' },
]
</script>