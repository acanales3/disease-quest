<template>
  <div class="max-w-6xl mx-auto w-full space-y-8">
    <div class="rounded-2xl overflow-hidden" style="background: linear-gradient(135deg, #3b1566 0%, #5a2590 50%, #3f1d72 100%);">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 px-8 py-7">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40 mb-2">Instructor Dashboard</p>
          <h1 class="text-[26px] font-semibold text-white tracking-tight leading-snug">
            Welcome back, {{ userName || "Instructor" }}
          </h1>
          <p class="text-white/60 text-[14px] mt-2 leading-relaxed max-w-lg">
            Track classroom activity, student participation, and case coverage from one place.
          </p>
          <div class="mt-4 flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 bg-white text-[#4d1979] text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm">
              <Icon name="lucide:layout-grid" size="11" />
              {{ dashboardData?.totalClassrooms ?? 0 }} classrooms
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
      Loading dashboard...
    </div>
    <div v-else-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
      {{ errorMessage }}
    </div>
    <template v-else>
      <div>
        <h2 class="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Overview</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <TotalCount
            icon="hugeicons:students"
            :count="dashboardData?.totalStudents ?? 0"
            label="Total students"
          />
          <TotalCount
            icon="lucide:layout-grid"
            :count="dashboardData?.totalClassrooms ?? 0"
            label="Classrooms"
          />
          <TotalCount
            icon="si:book-line"
            :count="dashboardData?.totalCases ?? 0"
            label="Cases"
          />
          <TotalCount
            icon="lucide:mail"
            :count="dashboardData?.totalInvitations ?? 0"
            label="Invitations sent"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
          <div class="flex items-center justify-between mb-5">
            <div>
              <p class="text-xs font-medium text-[#4d1979] uppercase tracking-wider">Insights</p>
              <h2 class="mt-1 text-xl font-semibold text-gray-900 tracking-tight">Student Participation</h2>
            </div>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-6 items-center">
            <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <DonutChart
                index="name"
                category="total"
                :data="graphData"
                :colors="participationColors"
                type="donut"
                :render-labels="true"
                :central-label="dashboardData?.totalInvitations ?? 0"
                sublabel="Total Invites"
                class="w-full"
              />
            </div>

            <div class="space-y-3">
              <div class="rounded-xl border border-[#4a2c6f] bg-gradient-to-r from-[#5f2a96] to-[#3f2463] p-4">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-white">Registered Students</p>
                  <span class="text-[11px] font-semibold uppercase tracking-wider text-white/90">
                    {{ registeredPercentage }}%
                  </span>
                </div>
                <p class="mt-2 text-[28px] font-semibold text-white leading-none tabular-nums">
                  {{ dashboardData?.registeredStudents ?? 0 }}
                </p>
              </div>

              <div class="rounded-xl border border-[#0f5d63] bg-gradient-to-r from-[#147a83] to-[#0f5d63] p-4">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-white">Unregistered Students</p>
                  <span class="text-[11px] font-semibold uppercase tracking-wider text-white/90">
                    {{ unregisteredPercentage }}%
                  </span>
                </div>
                <p class="mt-2 text-[28px] font-semibold text-white leading-none tabular-nums">
                  {{ dashboardData?.unregisteredStudents ?? 0 }}
                </p>
              </div>

              <p class="text-xs text-gray-500">
                Invitation status across your classroom roster.
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100">
            <p class="text-[13px] font-medium text-gray-900">Quick Actions</p>
          </div>
          <div class="divide-y divide-gray-100">
            <NuxtLink to="/instructor/students" class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
              <div class="w-8 h-8 rounded-lg bg-[#f5f3ff] text-[#4d1979] flex items-center justify-center">
                <Icon name="hugeicons:students" size="14" />
              </div>
              <div>
                <p class="text-[13px] font-medium text-gray-900">Students</p>
                <p class="text-[12px] text-gray-400">Manage your student roster</p>
              </div>
            </NuxtLink>
            <NuxtLink to="/instructor/classrooms" class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
              <div class="w-8 h-8 rounded-lg bg-[#f5f3ff] text-[#4d1979] flex items-center justify-center">
                <Icon name="lucide:layout-grid" size="14" />
              </div>
              <div>
                <p class="text-[13px] font-medium text-gray-900">Classrooms</p>
                <p class="text-[12px] text-gray-400">Open and organize your classes</p>
              </div>
            </NuxtLink>
            <NuxtLink to="/instructor/cases" class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
              <div class="w-8 h-8 rounded-lg bg-[#f5f3ff] text-[#4d1979] flex items-center justify-center">
                <Icon name="si:book-line" size="14" />
              </div>
              <div>
                <p class="text-[13px] font-medium text-gray-900">Cases</p>
                <p class="text-[12px] text-gray-400">Assign and review case activities</p>
              </div>
            </NuxtLink>
            <NuxtLink to="/instructor/analytics" class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
              <div class="w-8 h-8 rounded-lg bg-[#f5f3ff] text-[#4d1979] flex items-center justify-center">
                <Icon name="uim:analytics" size="14" />
              </div>
              <div>
                <p class="text-[13px] font-medium text-gray-900">Analytics</p>
                <p class="text-[12px] text-gray-400">Track classroom performance trends</p>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { DonutChart } from "@/components/ui/chart-donut"
import TotalCount from "@/components/ui/TotalCount.vue"
import { onMounted, ref, computed } from "vue"

export interface InstructorDashboard {
  instructorName: string;
  totalStudents: number;
  totalClassrooms: number;
  totalCases: number;
  registeredStudents: number;
  unregisteredStudents: number;
  totalInvitations: number;
}

const graphData = ref([
  { name: "Registered", total: 0 },
  { name: "Unregistered", total: 0 },
])
const participationColors = ["#5f2a96", "#147a83"]

const userName = ref('')
const isLoading = ref(true)
const errorMessage = ref('')

const dashboardData = ref<InstructorDashboard>()

const today = computed(() =>
  new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
)

const participationTotal = computed(() => {
  const total = (dashboardData.value?.registeredStudents ?? 0) + (dashboardData.value?.unregisteredStudents ?? 0)
  return total
})

const registeredPercentage = computed(() => {
  if (!participationTotal.value) return 0
  return Math.round(((dashboardData.value?.registeredStudents ?? 0) / participationTotal.value) * 100)
})

const unregisteredPercentage = computed(() => {
  if (!participationTotal.value) return 0
  return Math.round(((dashboardData.value?.unregisteredStudents ?? 0) / participationTotal.value) * 100)
})


async function getDashboardData(): Promise<InstructorDashboard>{
  return await $fetch('/api/instructors/dashboard')
}

onMounted(async () => {
  try {
    dashboardData.value = await getDashboardData()

    if (!dashboardData.value) return
    userName.value = dashboardData.value.instructorName
    graphData.value[0].total = dashboardData.value.registeredStudents || 0
    graphData.value[1].total = dashboardData.value.unregisteredStudents
  } catch (error) {
    errorMessage.value = "Unable to load instructor dashboard."
    console.error("Failed to fetch instructor's dashboard data:", error)
  } finally {
    isLoading.value = false
  }
})
</script>
