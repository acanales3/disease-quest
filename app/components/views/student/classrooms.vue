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
      <DataTable :columns="visibleColumns" :data="data" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Classroom } from '../../ClassroomDatatable/columns'
import { onMounted, ref, computed } from 'vue'
import { columns } from '../../ClassroomDatatable/columns'
import DataTable from '../../ClassroomDatatable/data-table.vue'
import TotalCount from '../../ui/TotalCount.vue'
import { classrooms } from '../../../assets/interface/Classroom'

const data = ref<Classroom[]>([])

const visibleColumns = computed(() => {
  return columns.map((col) => {
    const columnsToShow = [
      'id',
      'name',
      'code',
      'instructor',
      'section',
      'startDate',
      'endDate',
      'status',
    ]

    return {
      ...col,
      meta: {
        ...col.meta,
        hidden: !columnsToShow.includes(
          (col as any).accessorKey as string
                ),
            },
        }
    })
})

async function getData(): Promise<Classroom[]> {
  // Fetch data from your API here.
  return classrooms
}

onMounted(async () => {
  data.value = await getData()
})
</script>
