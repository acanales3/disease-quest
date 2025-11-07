<template>
  <div>
    <!-- Instructor Count & Instructor Invite -->
    <div class="flex justify-center gap-4">
      <TotalCount icon="mdi:teach" :count=count label="Total Instructors" />
      <InviteInstructorDialog />
    </div>
    
    <!-- Instructor Table -->
    <div class="container py-2 mx-auto">
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
import InviteInstructorDialog from "@/components/InviteInstructorDialog/InviteInstructorDialog.vue";

const data = ref<Instructor[]>([]);
const count = ref<number>(0);

async function getData(): Promise<Instructor[]> {
  // Fetch data from your API here.
  return instructors;
}

async function getInstructorCount(): Promise<number> {
  return 10;
}

onMounted(async () => {
  data.value = await getData();
  count.value = await getInstructorCount();
});
</script>
