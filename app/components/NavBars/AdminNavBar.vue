<template>
  <nav class="flex gap-4">
    <NuxtLink to="/admin/dashboard" exact>Dashboard</NuxtLink>
    <NuxtLink to="/admin/instructors">Instructors</NuxtLink>
    <NuxtLink to="/admin/students" exact>Students</NuxtLink>
    <NuxtLink to="/admin/classrooms">Classrooms</NuxtLink>
    <NuxtLink to="/admin/cases" exact>Cases</NuxtLink>
    <NuxtLink to="/admin/analytics">Analytics</NuxtLink>
    <NuxtLink to="/admin/leaderboard">Leaderboard</NuxtLink>
  </nav>
</template>

<style scoped>
a {
  color: white;
  text-decoration: none;
}
.router-link-exact-active {
  font-weight: bold;
  text-decoration: underline;
}
</style>
