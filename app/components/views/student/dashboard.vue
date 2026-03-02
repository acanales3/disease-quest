<template>
  <div class="w-full max-w-6xl mx-auto space-y-8">
    <div class="border-b border-gray-200 pb-8">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p class="text-xs font-medium text-[#4d1979] uppercase tracking-widest mb-2">Student Dashboard</p>
          <h1 class="text-3xl font-semibold text-gray-900 tracking-tight leading-snug">
            Welcome back, {{ userName }}
          </h1>
          <p class="text-gray-500 text-[15px] mt-2 leading-relaxed">
            Track your case progress, review your learning streak, and monitor your performance.
          </p>
          <div class="mt-3 flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 bg-gray-700 text-white text-xs font-medium px-3 py-1 rounded-full">
              <Icon name="lucide:book-open" size="11" />
              {{ stats?.total ?? 0 }} assigned cases
            </span>
          </div>
        </div>
        <div class="shrink-0 flex flex-col items-start sm:items-end gap-2">
          <div v-if="nickname" class="flex flex-col items-center gap-2">
            <div class="w-28 h-28 overflow-hidden flex items-center justify-center">
              <img
                v-if="avatarUrl"
                :src="avatarUrl"
                :alt="nickname"
                class="w-full h-full object-contain"
              />
              <div v-else-if="avatarLoading" class="flex items-center justify-center">
                <Icon name="lucide:loader-2" size="24" class="text-[#4d1979] animate-spin" />
              </div>
              <Icon v-else name="lucide:user" size="36" class="text-[#c4b5de]" />
            </div>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-[#4d1979] text-white text-xs font-medium px-3 py-1">
              Nickname: {{ nickname }}
            </span>
          </div>
          <p class="text-xs text-gray-400">{{ today }}</p>
        </div>
      </div>
    </div>

    <div v-if="pending" class="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
      Loading dashboard...
    </div>

    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-600">
      Failed to load student dashboard.
    </div>

    <template v-else>
      <div>
        <p class="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">Progress Overview</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2.5">
          <TotalCount
            class="bg-white border-gray-200 shadow-none"
            icon="mdi:check-circle"
            :count="`${stats?.completedPercent ?? 0}%`"
            label="Cases completed"
            :compact="true"
          />
          <TotalCount
            class="bg-white border-gray-200 shadow-none"
            icon="mdi:clock-outline"
            :count="stats?.inProgress ?? 0"
            label="Cases in progress"
            :compact="true"
          />
          <TotalCount
            class="bg-white border-gray-200 shadow-none"
            icon="lucide:pause-circle"
            :count="`${stats?.notStartedPercent ?? 0}%`"
            label="Cases not started"
            :compact="true"
          />
          <TotalCount
            class="bg-white border-gray-200 shadow-none"
            icon="mdi:fire"
            :count="stats?.login_streak ?? 0"
            label="Login streak"
            :compact="true"
          />
          <TrophyCard
            class="bg-white border-gray-200 shadow-none"
            :completed="stats?.completed ?? 0"
            :compact="true"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p class="text-[13px] font-medium text-gray-900">Recent Cases</p>
            <NuxtLink to="/student/cases" class="text-[12px] text-[#4d1979] hover:underline">View all</NuxtLink>
          </div>

          <div v-if="recentCases.length" class="divide-y divide-gray-100">
            <div v-for="item in recentCases" :key="item.id" class="px-5 py-3 flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[13px] font-medium text-gray-900 truncate">{{ item.name }}</p>
                <p class="text-[12px] text-gray-400 truncate">Classroom: {{ item.classroom || "-" }}</p>
              </div>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0"
                :class="statusClass(item.status)"
              >
                {{ statusLabel(item.status) }}
              </span>
            </div>
          </div>

          <div v-else class="px-5 py-8 text-sm text-gray-400">
            No cases assigned yet.
          </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100">
            <p class="text-[13px] font-medium text-gray-900">Quick Actions</p>
          </div>
          <div class="divide-y divide-gray-100">
            <NuxtLink to="/student/classrooms" class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
              <div class="w-8 h-8 rounded-lg bg-[#f5f3ff] text-[#4d1979] flex items-center justify-center">
                <Icon name="lucide:layout-grid" size="14" />
              </div>
              <div>
                <p class="text-[13px] font-medium text-gray-900">My Classrooms</p>
                <p class="text-[12px] text-gray-400">View enrolled classrooms</p>
              </div>
            </NuxtLink>
            <NuxtLink to="/student/cases" class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
              <div class="w-8 h-8 rounded-lg bg-[#f5f3ff] text-[#4d1979] flex items-center justify-center">
                <Icon name="lucide:book-open" size="14" />
              </div>
              <div>
                <p class="text-[13px] font-medium text-gray-900">Practice Cases</p>
                <p class="text-[12px] text-gray-400">Continue your simulations</p>
              </div>
            </NuxtLink>
            <NuxtLink to="/student/leaderboard" class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
              <div class="w-8 h-8 rounded-lg bg-[#f5f3ff] text-[#4d1979] flex items-center justify-center">
                <Icon name="lucide:trophy" size="14" />
              </div>
              <div>
                <p class="text-[13px] font-medium text-gray-900">Leaderboard</p>
                <p class="text-[12px] text-gray-400">Compare progress with peers</p>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import TotalCount from '@/components/ui/TotalCount.vue'
import { computed, ref, watch, onUnmounted } from 'vue'
import TrophyCard from '~/components/TrophyCard/TrophyCard.vue'
import { Icon } from '#components'

type DashboardResponse = {
    user: {
      name?: string | null
      first_name?: string | null
      last_name?: string | null
      nickname?: string | null
    }
    stats: any | null
    cases: StudentCase[]
}

type StudentCase = {
  id: number
  name: string
  classroom?: string
  status: "not started" | "in progress" | "completed"
}

const { data, pending, error } = await useFetch<DashboardResponse>(
    '/api/students/dashboard'
)

const stats = computed(() => data.value?.stats)
const cases = computed(() => data.value?.cases ?? [])
const recentCases = computed(() => cases.value.slice(0, 5))

const userName = computed(() => {
  const u = data.value?.user
  const fullName = [u?.first_name, u?.last_name].filter(Boolean).join(' ').trim()
  return fullName || u?.name || 'Student'
})

const nickname = computed(() => data.value?.user?.nickname?.trim() || "")

const avatarUrl = ref<string | null>(null)
const avatarLoading = ref(false)
let pollTimer: ReturnType<typeof setTimeout> | null = null

async function checkAvatar() {
  try {
    const result = await $fetch<{ avatarUrl: string | null; generating: boolean }>("/api/students/avatar")
    if (result.avatarUrl) {
      avatarUrl.value = result.avatarUrl
      avatarLoading.value = false
      return
    }
    if (result.generating) {
      avatarLoading.value = true
      pollTimer = setTimeout(checkAvatar, 4000)
      return
    }
    avatarLoading.value = false
  } catch {
    avatarUrl.value = null
    avatarLoading.value = false
  }
}

watch(nickname, (nick) => {
  if (pollTimer) { clearTimeout(pollTimer); pollTimer = null }
  if (!nick) return
  avatarLoading.value = true
  checkAvatar()
}, { immediate: true })

onUnmounted(() => {
  if (pollTimer) clearTimeout(pollTimer)
})

const statusClass = (status: StudentCase["status"]) => {
  if (status === "completed") return "bg-green-50 text-green-700 border-green-200"
  if (status === "in progress") return "bg-blue-50 text-blue-600 border-blue-200"
  return "bg-gray-50 text-gray-500 border-gray-200"
}

const statusLabel = (status: StudentCase["status"]) => {
  if (status === "completed") return "Completed"
  if (status === "in progress") return "In Progress"
  return "Not Started"
}

const today = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

</script>
