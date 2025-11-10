<script setup>
import PieChart from "../../PieChart/pie-chart.vue";

const data = [
  { name: "Registered", total: 30 },
  { name: "Unregistered", total: 10 },
];

const categories = ["Registered", "Unregistered"];
</script>

<template>
  <div>
    <h1>Dashboard</h1>
    <PieChart
      header="Student Participation"
      index="name"
      :category="'total'"
      :data="data"
      :type="'donut'"
      :categories="categories"
    />
  </div>
</template>
