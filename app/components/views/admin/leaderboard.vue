<template>
  <div class="flex flex-col items-center justify-center min-h-[200px] -mt-20 w-full">
    <!-- Top 3 Podium -->
    <div v-if="top3.length > 0" class="flex items-end justify-center gap-6"> 
      <!-- 2nd Place -->
      <div class="flex flex-col items-center">
        <div class="bg-white rounded-xl shadow-md px-4 py-2 w-40 text-center -mb-6">
          <p class="text-sm text-purple-500 font-semibold">2nd</p>
          <p class="font-medium">{{ top3[1].studentName }}</p>
        </div>
      </div>

      <!-- 1st Place -->
      <div class="flex flex-col items-center">
        <div class="bg-white rounded-xl shadow-md px-6 py-3 w-48 text-center">
          <p class="text-md text-purple-500 font-bold">1st</p>
          <p class="font-semibold text-lg">{{ top3[0].studentName }}</p>
        </div>
      </div>

      <!-- 3rd Place -->
      <div class="flex flex-col items-center">
        <div class="bg-white rounded-xl shadow-md px-4 py-2 w-40 text-center -mb-6">
          <p class="text-sm text-purple-500 font-semibold">3rd</p>
          <p class="font-medium">{{ top3[2].studentName }}</p>
        </div>
      </div>
    </div>

    <!-- Leaderboard Table -->
    <div class="container py-8 mx-auto">
      <DataTable :columns="columns" :data="data" :classrooms="classrooms" @classroom-selected="handleClassroomSelected" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LeaderboardEntry } from '../../LeaderboardDatatable/columns';
import { onMounted, ref } from 'vue';
import { columns } from '../../LeaderboardDatatable/columns';
import DataTable from '../../LeaderboardDatatable/data-table.vue';
import { leaderboard } from '~/assets/interface/Leaderboard';

const allData = ref<LeaderboardEntry[]>([]); 
const data = ref<LeaderboardEntry[]>([]);
const top3 = ref<LeaderboardEntry[]>([]); 
const classrooms = ref([
  { id: 1, name: 'Classroom 1' }, 
  { id: 2, name: 'Classroom 2' },                                   
  { id: 3, name: 'Classroom 3' }, 
]) // get classrooms user is in from api

function getPosition(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  // sort by score descending
  const sortedEntries = [...entries].sort((a, b) => b.score - a.score);

  let rank = 1;
  let previousScore = sortedEntries[0]?.score ?? 0;

  return sortedEntries.map((entry, index) => {
    if (index === 0) {
      entry.position = rank;
    } else {
      if (entry.score === previousScore) {
        entry.position = rank; // same rank as previous entry
      } else {
        rank = index + 1;
        entry.position = rank;
        previousScore = entry.score; // update previous score for next comparison
      }
    }
    return entry;
  });
}

function handleClassroomSelected(classroomId: number) {
  const filtered = allData.value.filter(entry => entry.classroomId === classroomId);
  const positions = getPosition(filtered);
  data.value = positions;
  top3.value = positions.slice(0, 3);
}
                                
async function getData(): Promise<LeaderboardEntry[]> {
  // Fetch data from the API here.
  // For now, we will use the mock leaderboard data from the interface.
  return leaderboard;
}                                 
onMounted(async () => {
  allData.value = await getData();
  handleClassroomSelected(classrooms.value[0].id);
});
</script>
