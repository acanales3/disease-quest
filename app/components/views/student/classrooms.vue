<template>
  <div class="space-y-6">
    <div class="border-b border-gray-200 pb-8">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="text-xs font-medium text-[#4d1979] uppercase tracking-widest mb-2">Learning</p>
          <h1 class="text-3xl font-semibold text-gray-900 tracking-tight leading-snug">Classrooms</h1>
          <p class="text-gray-500 text-[15px] mt-2">
            View and join classrooms.
          </p>
          <div class="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#4d1979]">
            <ClassroomIcon :size="15" icon-class="text-white" />
            <span class="text-[13px] font-medium text-white">{{ data.length }} classrooms</span>
          </div>
        </div>
        <Button
          class="bg-[#4d1979] hover:bg-[#3f1564] text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 shrink-0"
          @click="joinOpen = true"
        >
          <Icon name="lucide:user-plus" size="15" />
          Join Classroom
        </Button>
      </div>
    </div>

    <div v-if="isLoading" class="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
      Loading classrooms...
    </div>
    <div v-else class="w-full">
      <DataTable :columns="visibleColumns" :data="data" user-role="student" />
    </div>

    <JoinClassDialog v-model:open="joinOpen" @joined="handleJoined" />
  </div>
</template>

<script setup lang="ts">
import type { Classroom } from "../../ClassroomDatatable/columns"
import { onMounted, ref, computed } from "vue"
import { getColumns } from "../../ClassroomDatatable/columns"
import DataTable from "../../ClassroomDatatable/data-table.vue"
import JoinClassDialog from "@/components/JoinClassDialog/JoinClassDialog.vue"
import { Button } from "@/components/ui/button"
import { Icon } from "#components"
import ClassroomIcon from "../../icons/ClassroomIcon.vue"

const data = ref<Classroom[]>([])
const joinOpen = ref(false)
const isLoading = ref(true)


// ---------------------------------------------
// FILTER STUDENT COLUMNS (REMOVE SCHOOL)
// ---------------------------------------------
const visibleColumns = computed(() => {
  // columns students should see
  const columnsToShow = [
    "id",
    "name",
    "code",
    "instructor",
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
    const raw = await $fetch<any[]>("/api/classrooms")
    return raw.map((c) => ({
      ...c,
      instructor: c.instructor_name ?? c.instructor ?? "",
    }))
  } catch (error) {
    console.error("Failed to fetch classrooms:", error)
    return []
  }
}

async function refresh() {
  isLoading.value = true
  data.value = await getData()
  isLoading.value = false
}

function handleJoined() {
  refresh()
}

onMounted(async () => {
  await refresh()
})
</script>
