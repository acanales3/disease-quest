<template>
  <div class="container py-2 mx-auto">
    <DataTable :columns="columns" :data="data"/>
  </div>
</template>

<script setup lang="ts">
import type { Student } from "../../StudentDatatable/columns";
import { onMounted, ref } from "vue";
import { columns } from "../../StudentDatatable/columns";
import DataTable from "../../StudentDatatable/data-table.vue";
import { student } from "~/assets/interface/Student";

const data = ref<Student[]>([]);

async function getData(): Promise<Student[]> {
    // Fetch data from the API here.
    // For now, we will use the mock student data from the interface.
    return student;
}

onMounted(async () => {
    data.value = await getData();
});
</script>
