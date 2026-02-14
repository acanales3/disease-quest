<template>
  <div class="flex flex-col w-full">

    <div class="flex justify-center gap-4">
      <TotalCount
        :count="data.length"
        label="Total Classrooms"
        icon="simple-icons:googleclassroom"
      />
    </div>

    <div class="w-full py-2">
      <DataTable :columns="columns" :data="data" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Classroom } from '../../ClassroomDatatable/columns'
import { onMounted, ref } from 'vue'
import { getColumns } from '../../ClassroomDatatable/columns'
import DataTable from '../../ClassroomDatatable/data-table.vue'
import TotalCount from '../../ui/TotalCount.vue'

const data = ref<Classroom[]>([])
const columns = getColumns('student')

async function getData(): Promise<Classroom[]> {
  try {
    return await $fetch<Classroom[]>('/api/classrooms')
  } catch (error) {
    console.error('Failed to fetch classrooms:', error)
    return []
  }
}

onMounted(async () => {
  data.value = await getData()
})
</script>
