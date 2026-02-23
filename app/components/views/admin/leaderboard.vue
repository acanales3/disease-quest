<template>
  <div class="flex flex-col items-center justify-center w-full space-y-8">
    <!-- Top 3 Podium -->
    <div v-if="top3.length > 0" class="flex items-end justify-center gap-8">
      <!-- 2nd Place -->
      <div class="flex flex-col items-center">
        <div
          class="bg-white rounded-xl shadow-md px-4 py-2 w-40 text-center -mb-6"
        >
          <p class="text-sm text-purple-500 font-semibold">2nd</p>
          <p class="font-medium">{{ displayName(top3[1]) }}</p>
        </div>
      </div>

      <!-- 1st Place -->
      <div class="flex flex-col items-center">
        <div class="bg-white rounded-xl shadow-md px-6 py-3 w-48 text-center">
          <p class="text-md text-purple-500 font-bold">1st</p>
          <p class="font-semibold text-lg">{{ displayName(top3[0]) }}</p>
        </div>
      </div>

      <!-- 3rd Place -->
      <div class="flex flex-col items-center">
        <div
          class="bg-white rounded-xl shadow-md px-4 py-2 w-40 text-center -mb-6"
        >
          <p class="text-sm text-purple-500 font-semibold">3rd</p>
          <p class="font-medium">{{ displayName(top3[2]) }}</p>
        </div>
      </div>
    </div>

    <!-- Leaderboard Table -->
    <div class="w-full py-8">
      <DataTable
        :columns="columns"
        :data="data"
        :classrooms="classrooms"
        :selected-classroom-id="selectedClassroomId"
        @classroom-selected="handleClassroomSelected"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LeaderboardEntry } from "~/assets/interface/Leaderboard";
import { onMounted, ref, computed } from "vue";
import { adminColumns } from "@/components/LeaderboardDatatable/columns";
import DataTable from "@/components/LeaderboardDatatable/data-table.vue";
import { leaderboard } from "~/assets/interface/Leaderboard";

const props = defineProps<{ role: "admin" | "student" | "instructor" }>();

const allData = ref<LeaderboardEntry[]>([]);
const data = ref<LeaderboardEntry[]>([]);
const top3 = ref<LeaderboardEntry[]>([]);

const classrooms = ref<{id: number, name: string}[]>([
  { id: -1, name: "All Classrooms" },
]);

async function fetchClassrooms() {
    try {
        const data = await $fetch<{id: number, name: string}[]>('/api/classrooms');
        if (data) {
            classrooms.value = [
                { id: -1, name: "All Classrooms" },
                ...data.map((c: any) => ({ id: c.id, name: c.name }))
            ];
        }
    } catch (e) {
        console.error("Failed to fetch classrooms", e);
    }
}

const columns = computed(() => adminColumns);

async function getData(classroomId?: number): Promise<LeaderboardEntry[]> {
    const query = classroomId && classroomId !== -1 ? { classroomId } : {};
    return await $fetch<LeaderboardEntry[]>('/api/leaderboards', { query });
}

const selectedClassroomId = ref<number>(-1);

async function handleClassroomSelected(classroomId: number) {
    if (classroomId === undefined) return;
    
    selectedClassroomId.value = classroomId;
    data.value = await getData(classroomId);
    top3.value = data.value.slice(0, 3);
    allData.value = data.value;
}

function displayName(entry?: LeaderboardEntry) {
  return entry?.studentName ?? entry?.nickname ?? "-";
}

onMounted(async () => {
    await Promise.all([
        getData().then(d => {
            data.value = d;
            top3.value = d.slice(0, 3);
            allData.value = d;
        }),
        fetchClassrooms()
    ]);
});
</script>
