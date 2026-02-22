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
  { label: 'Dashboard', to: '/admin/dashboard', icon: 'iconamoon:home-light' },
  { label: 'Administrators', to: '/admin/admins', icon: 'eos-icons-admin' },
  { label: 'Instructors', to: '/admin/instructors', icon: 'hugeicons:teacher' },
  { label: 'Students', to: '/admin/students', icon: 'hugeicons:students' },
  { label: 'Classrooms', to: '/admin/classrooms', icon: 'simple-icons:googleclassroom' },
  { label: 'Cases', to: '/admin/cases', icon: 'si:book-line' },
  { label: 'Analytics', to: '/admin/analytics', icon: 'uim:analytics' },
  { label: 'Leaderboard', to: '/admin/leaderboard', icon: 'material-symbols:social-leaderboard-outline-rounded' },
]
</script>
