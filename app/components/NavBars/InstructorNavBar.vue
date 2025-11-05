<template>
  <nav class="flex gap-4">
    <NuxtLink to="/instructor/dashboard" exact>Dashboard</NuxtLink>
    <NuxtLink to="/instructor/students" exact>Students</NuxtLink>
    <NuxtLink to="/instructor/classrooms">Classrooms</NuxtLink>
    <NuxtLink to="/instructor/cases" exact>Cases</NuxtLink>
    <NuxtLink to="/instructor/analytics">Analytics</NuxtLink>
    <NuxtLink to="/instructor/leaderboard">Leaderboard</NuxtLink>
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
