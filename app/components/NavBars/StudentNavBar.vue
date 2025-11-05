<template>
  <nav class="flex gap-4">
    <NuxtLink to="/student/dashboard" exact>Dashboard</NuxtLink>
    <NuxtLink to="/student/classrooms">Classrooms</NuxtLink>
    <NuxtLink to="/student/cases" exact>Cases</NuxtLink>
    <NuxtLink to="/student/analytics">Analytics</NuxtLink>
    <NuxtLink to="/student/leaderboard">Leaderboard</NuxtLink>
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
