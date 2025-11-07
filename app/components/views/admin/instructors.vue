<template>
  <div class="container py-2 mx-auto">
    <DataTable :columns="columns" :data="data" />
  </div>
</template>

<script setup lang="ts">
import type { Instructor } from "../../InstructorDatatable/columns";
import { onMounted, ref } from "vue";
import { columns } from "../../InstructorDatatable/columns";
import DataTable from "../../InstructorDatatable/data-table.vue";
import { instructors } from "../../../assets/interface/Instructor";

const data = ref<Instructor[]>([]);

async function getData(): Promise<Instructor[]> {
  // Fetch data from your API here.
  return instructors;
}

onMounted(async () => {
  data.value = await getData();
});
</script>
