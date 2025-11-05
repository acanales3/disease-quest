<template>
  <nav class="flex flex-col space-y-2 p-4">
    <NuxtLink to="/admin/dashboard" exact class="block px-3 py-2 rounded hover:bg-white transition hover:text-black">Dashboard</NuxtLink>
    <NuxtLink to="/admin/instructors" class="block px-3 py-2 rounded hover:bg-white transition hover:text-black">Instructors</NuxtLink>
    <NuxtLink to="/admin/students" exact class="block px-3 py-2 rounded hover:bg-white transition hover:text-black">Students</NuxtLink>
    <NuxtLink to="/admin/classrooms"exact class="block px-3 py-2 rounded hover:bg-white transition hover:text-black">Classrooms</NuxtLink>
    <NuxtLink to="/admin/cases" exact class="block px-3 py-2 rounded hover:bg-white transition hover:text-black">Cases</NuxtLink>
    <NuxtLink to="/admin/analytics" exact class="block px-3 py-2 rounded hover:bg-white transition hover:text-black">Analytics</NuxtLink>
    <NuxtLink to="/admin/leaderboard" exact class="block px-3 py-2 rounded hover:bg-white transition hover:text-black">Leaderboard</NuxtLink>
  </nav>
</template>

