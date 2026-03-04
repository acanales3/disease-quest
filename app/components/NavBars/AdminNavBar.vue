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

    <p class="px-3 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">People</p>
    <NuxtLink
      v-for="link in peopleLinks"
      :key="link.to"
      :to="link.to"
      exact
      class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-gray-600 hover:bg-[#f5f3ff] hover:text-[#4d1979] transition-colors"
      active-class="!bg-[#ede9fe] !text-[#4d1979] font-semibold"
    >
      <Icon :name="link.icon" class="text-lg shrink-0" />
      <span>{{ link.label }}</span>
    </NuxtLink>

    <p class="px-3 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Content</p>
    <NuxtLink
      to="/admin/classrooms"
      exact
      class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-gray-600 hover:bg-[#f5f3ff] hover:text-[#4d1979] transition-colors"
      active-class="!bg-[#ede9fe] !text-[#4d1979] font-semibold"
    >
      <ClassroomIcon :size="18" class="shrink-0" />
      <span>Classrooms</span>
    </NuxtLink>
    <NuxtLink
      v-for="link in contentLinks"
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
import ClassroomIcon from '../icons/ClassroomIcon.vue'
const overviewLinks = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: 'iconamoon:home-light' },
]

const peopleLinks = [
  { label: 'Administrators', to: '/admin/admins', icon: 'eos-icons-admin' },
  { label: 'Instructors', to: '/admin/instructors', icon: 'hugeicons:teacher' },
  { label: 'Students', to: '/admin/students', icon: 'hugeicons:students' },
]

const contentLinks = [
  { label: 'Cases', to: '/admin/cases', icon: 'si:book-line' },
]

const insightLinks = [
  { label: 'Analytics', to: '/admin/analytics', icon: 'uim:analytics' },
  { label: 'Leaderboard', to: '/admin/leaderboard', icon: 'lucide:trophy' },
]
</script>
