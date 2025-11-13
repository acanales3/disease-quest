<template>
  <div class="flex flex-col w-full">
    <!-- Instructor Count & Instructor Invite -->
    <div class="flex justify-center gap-4">
      <TotalCount icon="hugeicons:teacher" :count="data.length" label="Total Instructors" />
      <InviteDialog dialog-type="instructor" />
    </div>
    
    <!-- Instructor Table -->
    <div class="w-full py-2">
      <DataTable :columns="columns" :data="data" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Instructor } from "../../InstructorDatatable/columns";
import { onMounted, ref } from "vue";
import { columns } from "../../InstructorDatatable/columns";
import DataTable from "../../InstructorDatatable/data-table.vue";
import { instructors } from "../../../assets/interface/Instructor";
import TotalCount from "@/components/ui/TotalCount.vue";
import InviteDialog from "@/components/InviteDialog/InviteDialog.vue";

const data = ref<Instructor[]>([]);

async function getData(): Promise<Instructor[]> {
  // Fetch data from your API here.
  return instructors;
}

onMounted(async () => {
  data.value = await getData();
});
</script>
