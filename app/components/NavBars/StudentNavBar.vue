<template>
  <nav class="flex flex-col gap-1">
    <p class="px-3 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Overview</p>
    <NuxtLink
      v-for="link in overviewLinks"
      :key="link.to"
      :to="link.to"
      exact
      class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-gray-600 hover:bg-[#f5f3ff] hover:text-[#4d1979] transition-colors"
      active-class="!bg-[#ede9fe] !text-[#4d1979] font-semibold"
    >
      <Icon :name="link.icon" class="text-lg shrink-0" />
      <span>{{ link.label }}</span>
    </NuxtLink>

    <p class="px-3 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Learning</p>
    <NuxtLink
      v-for="link in learningLinks"
      :key="link.to"
      :to="link.to"
      exact
      class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-gray-600 hover:bg-[#f5f3ff] hover:text-[#4d1979] transition-colors"
      active-class="!bg-[#ede9fe] !text-[#4d1979] font-semibold"
    >
      <Icon :name="link.icon" class="text-lg shrink-0" />
      <span>{{ link.label }}</span>
    </NuxtLink>

    <p class="px-3 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Insights</p>
    <NuxtLink
      v-for="link in insightLinks"
      :key="link.to"
      :to="link.to"
      exact
      class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-gray-600 hover:bg-[#f5f3ff] hover:text-[#4d1979] transition-colors"
      active-class="!bg-[#ede9fe] !text-[#4d1979] font-semibold"
    >
      <Icon :name="link.icon" class="text-lg shrink-0" />
      <span>{{ link.label }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup>
const overviewLinks = [
  { label: 'Dashboard', to: '/student/dashboard', icon: 'iconamoon:home-light' },
]

const learningLinks = [
  { label: 'Classrooms', to: '/student/classrooms', icon: 'simple-icons:googleclassroom' },
  { label: 'Cases', to: '/student/cases', icon: 'si:book-line' },
]

const insightLinks = [
  { label: 'Analytics', to: '/student/analytics', icon: 'uim:analytics' },
  { label: 'Leaderboard', to: '/student/leaderboard', icon: 'lucide:trophy' },
]
</script>