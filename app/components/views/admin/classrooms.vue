<template>
  <div class="container py-2 mx-auto">
    <DataTable :columns="columns" :data="data" />
  </div>
</template>

<script setup lang="ts">
import type { Classroom } from "../../ClassroomDatatable/columns";
import { onMounted, ref } from "vue";
import { columns } from "../../ClassroomDatatable/columns";
import DataTable from "../../ClassroomDatatable/data-table.vue";
import { classrooms } from "../../../assets/interface/Classroom";

const data = ref<Classroom[]>([]);

async function getData(): Promise<Classroom[]> {
  // Fetch data from your API here.
  return classrooms;
}

onMounted(async () => {
  data.value = await getData();
});
</script>
