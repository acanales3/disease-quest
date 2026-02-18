<template>
  <div class="flex flex-col w-full">

    <div class="flex justify-center gap-4">
      <TotalCount
        :count="data.length"
        label="Total Classrooms"
        icon="simple-icons:googleclassroom"
      />

      <Button variant="outline"
        class="h-28 w-48 flex flex-col items-center justify-center gap-2 p-4" @click="joinOpen=true">
        <JoinClassDialog v-model:open="joinOpen" @joined="handleJoined" />
      </Button>
    </div>

    <div class="w-full py-2">
      <DataTable :columns="columns" :data="data" user-role="student" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Classroom } from '../../ClassroomDatatable/columns'
import { onMounted, ref } from 'vue'
import { getColumns } from '../../ClassroomDatatable/columns'
import DataTable from '../../ClassroomDatatable/data-table.vue'
import TotalCount from '../../ui/TotalCount.vue'
import JoinClassDialog from '@/components/JoinClassDialog/JoinClassDialog.vue'
import { Button } from '@/components/ui/button' 

const data = ref<Classroom[]>([])
const columns = getColumns('student')
const joinOpen = ref(false)

async function getData(): Promise<Classroom[]> {
  try {
    return await $fetch<Classroom[]>('/api/classrooms')
  } catch (error) {
    console.error('Failed to fetch classrooms:', error)
    return []
  }
}

async function refresh() {
  data.value = await getData();
}

function handleJoined() {
  refresh();
}

onMounted(async () => {
  data.value = await getData()
})
</script>
