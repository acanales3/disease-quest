<template>
  <!-- Mobile toggle button (ONLY when closed) -->
  <button
    v-if="!isOpen"
    class="md:hidden fixed top-4 left-4 z-50 p-2 rounded bg-[#AF67F0] text-white"
    @click="isOpen = true"
  >
    <Icon name="mdi:menu" class="text-xl" />
  </button>

  <!-- Nav -->
  <nav
    class="flex flex-col space-y-2 z-40
           md:relative md:translate-x-0
           fixed top-0 left-0 h-full w-64 transition-transform duration-300
           bg-[#AF67F0] text-white shadow-xl"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
  >
    <!-- Mobile header (logo + close button) -->
    <div class="flex items-center justify-between p-4 md:hidden">
      <div class="flex items-center gap-4">
        <Icon name="healthicons:autoimmune-disease-outline" class="text-4xl" />
        <span class="text-2xl font-bold">DiseaseQuest</span>
      </div>

      <!-- Close button INSIDE nav -->
      <button
        class="ml-1 p-1 rounded hover:bg-white/20"
        @click="isOpen = false"
      >
        <Icon name="mdi:close" class="text-xl" />
      </button>
    </div>

    <!-- Links -->
    <NuxtLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      exact
      class="flex items-center gap-2 px-4 py-2 mx-2 rounded transition hover:bg-white hover:text-black text-white"
      active-class="!bg-white !text-black"
      @click="isOpen = false"
    >
      <Icon :name="link.icon" class="text-xl" />
      <span>{{ link.label }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup>
import { inject } from 'vue'

const isOpen = inject('navIsOpen')

const links = [
  { label: 'Dashboard',      to: '/admin/dashboard',   icon: 'iconamoon:home-light' },
  { label: 'Administrators', to: '/admin/admins',      icon: 'eos-icons-admin' },
  { label: 'Instructors',    to: '/admin/instructors', icon: 'hugeicons:teacher' },
  { label: 'Students',       to: '/admin/students',    icon: 'hugeicons:students' },
  { label: 'Classrooms',     to: '/admin/classrooms',  icon: 'simple-icons:googleclassroom' },
  { label: 'Cases',          to: '/admin/cases',       icon: 'si:book-line' },
  { label: 'Analytics',      to: '/admin/analytics',   icon: 'uim:analytics' },
  { label: 'Leaderboard',    to: '/admin/leaderboard', icon: 'material-symbols:social-leaderboard-outline-rounded' },
]
</script>