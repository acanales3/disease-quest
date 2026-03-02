<template>
  <div class="w-full flex flex-col gap-8">
    <div class="border-b border-gray-200 pb-8">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="text-xs font-medium text-[#4d1979] uppercase tracking-widest mb-2">Insights</p>
          <h1 class="text-3xl font-semibold text-gray-900 tracking-tight leading-snug">Leaderboard</h1>
          <p class="text-gray-500 text-[15px] mt-2 leading-relaxed">
            Students ranked by completed cases and average scores.
          </p>
        </div>
        <button
          class="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4d1979] hover:bg-[#3f1564] text-white text-sm font-medium transition-colors"
          @click="celebrate"
        >
          <Icon name="lucide:party-popper" size="14" />
          Celebrate
        </button>
      </div>
    </div>

    <div class="confetti-layer" v-if="confettiPieces.length">
      <span
        v-for="piece in confettiPieces"
        :key="piece.id"
        class="confetti-piece"
        :style="{
          left: piece.left + 'vw',
          width: piece.size + 'px',
          height: piece.size * 0.55 + 'px',
          background: piece.color,
          animationDelay: piece.delay + 'ms',
          animationDuration: piece.duration + 'ms',
          transform: `rotate(${piece.rotate}deg)`,
          opacity: piece.opacity,
        }"
      />
    </div>

    <div v-if="isLoading" class="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
      Loading leaderboard...
    </div>
    <div v-else-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <!-- Top 3 Podium -->
    <div v-else-if="top3.length > 0" class="flex items-end justify-center gap-3 px-8">
      <!-- 2nd Place — Silver -->
      <div class="flex flex-col items-center flex-1 max-w-[220px]">
        <div class="mb-3 text-center">
          <div class="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-2" style="background:linear-gradient(135deg,#e8e8e8,#a8a8a8,#d4d4d4);">
            <span class="text-base font-bold" style="color:#555;">2</span>
          </div>
          <p class="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{{ displayName(top3[1]) }}</p>
          <p class="text-xs tabular-nums mt-0.5 font-medium text-gray-400">{{ top3[1]?.averageScore != null ? top3[1].averageScore.toFixed(2) + '%' : '—' }}</p>
        </div>
        <div class="w-full rounded-t-xl flex items-center justify-center" style="height:80px; background:linear-gradient(135deg,#e8e8e8,#a8a8a8,#d4d4d4);">
          <span class="text-2xl font-bold" style="color:rgba(255,255,255,0.5)">2</span>
        </div>
      </div>

      <!-- 1st Place — Gold -->
      <div class="flex flex-col items-center flex-1 max-w-[240px]">
        <div class="mb-3 text-center">
          <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2" style="background:linear-gradient(135deg,#f9e07a,#d4a017,#f5c518);">
            <Icon name="lucide:crown" size="18" class="text-white drop-shadow" />
          </div>
          <p class="text-sm font-bold text-gray-900 truncate max-w-[200px]">{{ displayName(top3[0]) }}</p>
          <p class="text-xs font-medium tabular-nums mt-0.5" style="color:#b8860b;">{{ top3[0]?.averageScore != null ? top3[0].averageScore.toFixed(2) + '%' : '—' }}</p>
        </div>
        <div class="w-full rounded-t-xl flex items-center justify-center" style="height:120px; background:linear-gradient(135deg,#f9e07a,#d4a017,#f5c518);">
          <span class="text-3xl font-bold" style="color:rgba(255,255,255,0.35)">1</span>
        </div>
      </div>

      <!-- 3rd Place — Bronze -->
      <div class="flex flex-col items-center flex-1 max-w-[220px]">
        <div class="mb-3 text-center">
          <div class="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-2" style="background:linear-gradient(135deg,#e8b87a,#a0522d,#cd7f32);">
            <span class="text-base font-bold text-white">3</span>
          </div>
          <p class="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{{ displayName(top3[2]) }}</p>
          <p class="text-xs tabular-nums mt-0.5 font-medium" style="color:#a0522d;">{{ top3[2]?.averageScore != null ? top3[2].averageScore.toFixed(2) + '%' : '—' }}</p>
        </div>
        <div class="w-full rounded-t-xl flex items-center justify-center" style="height:56px; background:linear-gradient(135deg,#e8b87a,#a0522d,#cd7f32);">
          <span class="text-2xl font-bold" style="color:rgba(255,255,255,0.35)">3</span>
        </div>
      </div>
    </div>

    <div v-else class="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
      No leaderboard data available.
    </div>

    <!-- Leaderboard Table -->
    <div class="overflow-hidden">
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
import { baseColumns } from "@/components/LeaderboardDatatable/columns";
import DataTable from "@/components/LeaderboardDatatable/data-table.vue";

const props = defineProps<{ role: "admin" | "student" | "instructor" }>();

const allData = ref<LeaderboardEntry[]>([]);
const data = ref<LeaderboardEntry[]>([]);
const top3 = ref<LeaderboardEntry[]>([]);
const isLoading = ref(true);
const errorMessage = ref("");
const confettiPieces = ref<Array<{
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotate: number;
  opacity: number;
}>>([]);

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

const columns = computed(() => baseColumns);

async function getData(classroomId?: number): Promise<LeaderboardEntry[]> {
    const query = classroomId && classroomId !== -1 ? { classroomId } : {};
    return await $fetch<LeaderboardEntry[]>('/api/leaderboards', { query });
}

const selectedClassroomId = ref<number>(-1);

async function handleClassroomSelected(classroomId: number) {
    if (classroomId === undefined) return;

    selectedClassroomId.value = classroomId;
    try {
      errorMessage.value = "";
      data.value = await getData(classroomId);
      top3.value = data.value.slice(0, 3);
      allData.value = data.value;
    } catch (e: any) {
      errorMessage.value = e?.data?.message || e?.statusMessage || "Failed to load leaderboard data.";
    }
}

function displayName(entry?: LeaderboardEntry) {
  return entry?.nickname ?? "-";
}

function celebrate() {
  const colors = ["#4d1979", "#7c3aed", "#10b981", "#f59e0b", "#ef4444", "#1d4ed8"];
  confettiPieces.value = Array.from({ length: 80 }, (_, i) => ({
    id: Date.now() + i,
    left: Math.random() * 100,
    delay: Math.random() * 220,
    duration: 2200 + Math.random() * 1200,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 6 + Math.random() * 8,
    rotate: Math.random() * 360,
    opacity: 0.75 + Math.random() * 0.25,
  }));

  setTimeout(() => {
    confettiPieces.value = [];
  }, 3600);
}

onMounted(async () => {
    try {
      errorMessage.value = "";
      await Promise.all([
          getData().then(d => {
              data.value = d;
              top3.value = d.slice(0, 3);
              allData.value = d;
          }),
          fetchClassrooms()
      ]);
    } catch (e: any) {
      errorMessage.value = e?.data?.message || e?.statusMessage || "Failed to load leaderboard.";
    } finally {
      isLoading.value = false;
    }
});
</script>

<style scoped>
.confetti-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 60;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  top: -14px;
  border-radius: 2px;
  animation-name: dq-confetti-fall;
  animation-timing-function: cubic-bezier(0.33, 1, 0.68, 1);
  animation-fill-mode: forwards;
}

@keyframes dq-confetti-fall {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  100% {
    transform: translate3d(0, 110vh, 0) rotate(520deg);
    opacity: 0;
  }
}
</style>
