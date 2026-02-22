<template>
  <div class="flex flex-col w-full">

    <div class="flex justify-center gap-4">
      <TotalCount
        :count="data.length"
        label="Total Classrooms"
        icon="simple-icons:googleclassroom"
      />

      <Button
        variant="outline"
        class="h-28 w-48 flex flex-col items-center justify-center gap-2 p-4"
        @click="joinOpen = true"
      >
        <JoinClassDialog v-model:open="joinOpen" @joined="handleJoined" />
      </Button>
    </div>

    <div class="w-full py-2">
      <!-- use filtered columns -->
      <DataTable
        :columns="visibleColumns"
        :data="data"
        user-role="student"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import type { Classroom } from "../../ClassroomDatatable/columns"
import { onMounted, ref, computed } from "vue"
import { getColumns } from "../../ClassroomDatatable/columns"
import DataTable from "../../ClassroomDatatable/data-table.vue"
import TotalCount from "../../ui/TotalCount.vue"
import JoinClassDialog from "@/components/JoinClassDialog/JoinClassDialog.vue"
import { Button } from "@/components/ui/button"

const data = ref<Classroom[]>([])
const joinOpen = ref(false)


// ---------------------------------------------
// FILTER STUDENT COLUMNS (REMOVE SCHOOL)
// ---------------------------------------------
const visibleColumns = computed(() => {
  // columns students should see
  const columnsToShow = [
    "id",
    "name",
    "code",
    "section",
    "startDate",
    "endDate",
    "status"
  ]

  return getColumns("student").filter((column) => {
    const key =
      "id" in column
        ? column.id
        : "accessorKey" in column
        ? column.accessorKey
        : undefined

    return key ? columnsToShow.includes(String(key)) : false
  })
})


// ---------------------------------------------
// DATA FETCHING
// ---------------------------------------------
async function getData(): Promise<Classroom[]> {
  try {
    return await $fetch<Classroom[]>("/api/classrooms")
  } catch (error) {
    console.error("Failed to fetch classrooms:", error)
    return []
  }
}

async function refresh() {
  data.value = await getData()
}

function handleJoined() {
  refresh()
}

onMounted(async () => {
  data.value = await getData()
})
</script>
