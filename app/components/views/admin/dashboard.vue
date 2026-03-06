<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="rounded-2xl overflow-hidden" style="background: linear-gradient(135deg, #3b1566 0%, #5a2590 50%, #3f1d72 100%);">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 px-8 py-7">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40 mb-2">Admin Dashboard</p>
          <h1 class="text-[26px] font-semibold text-white tracking-tight leading-snug">
            Welcome back, {{ user.name }}
          </h1>
          <p class="text-white/60 text-[14px] mt-2 leading-relaxed max-w-lg">
            DiseaseQuest lets you practice diagnosis, treatment planning, and clinical decision-making through realistic, interactive patient simulations.
          </p>
          <div class="mt-4 flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 bg-white text-[#4d1979] text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm">
              <Icon name="eos-icons-admin" size="15" />
              Administrator
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div>
    <p class="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">Platform Overview</p>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <TotalCount :count="counts.students" label="Students" icon="hugeicons:students" :meta="latestMeta.students" />
      <TotalCount :count="counts.instructors" label="Instructors" icon="hugeicons:teacher" :meta="latestMeta.instructors" />
      <TotalCount :count="counts.classrooms" label="Classrooms" icon="simple-icons:googleclassroom" :meta="latestMeta.classrooms" />
      <TotalCount :count="counts.cases" label="Cases" icon="si:book-line" :meta="latestMeta.cases" />
    </div>
    </div>

    <!-- Quick Actions -->
    <div>
      <p class="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">Quick Actions</p>
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">

        <NuxtLink to="/admin/students" class="group bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 hover:border-[#4d1979]/30 hover:shadow-sm transition-all">
          <div class="w-9 h-9 rounded-lg bg-black flex items-center justify-center shrink-0">
            <Icon name="hugeicons:students" size="16" class="text-white" />
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-900">Students</p>
            <p class="text-xs text-gray-400 mt-0.5 leading-relaxed">View, invite, edit, and manage students</p>
          </div>
        </NuxtLink>

        <NuxtLink to="/admin/instructors" class="group bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 hover:border-[#4d1979]/30 hover:shadow-sm transition-all">
          <div class="w-9 h-9 rounded-lg bg-black flex items-center justify-center shrink-0">
            <Icon name="hugeicons:teacher" size="16" class="text-white" />
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-900">Instructors</p>
            <p class="text-xs text-gray-400 mt-0.5 leading-relaxed">View, invite, edit, and manage instructors</p>
          </div>
        </NuxtLink>

        <NuxtLink to="/admin/classrooms" class="group bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 hover:border-[#4d1979]/30 hover:shadow-sm transition-all">
          <div class="w-9 h-9 rounded-lg bg-black flex items-center justify-center shrink-0">
            <Icon name="simple-icons:googleclassroom" size="16" class="text-white" />
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-900">Classrooms</p>
            <p class="text-xs text-gray-400 mt-0.5 leading-relaxed">Create, edit, and manage classrooms</p>
          </div>
        </NuxtLink>

        <NuxtLink to="/admin/cases" class="group bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 hover:border-[#4d1979]/30 hover:shadow-sm transition-all">
          <div class="w-9 h-9 rounded-lg bg-black flex items-center justify-center shrink-0">
            <Icon name="si:book-line" size="16" class="text-white" />
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-900">Cases</p>
            <p class="text-xs text-gray-400 mt-0.5 leading-relaxed">Create, edit, play, and assign cases to classrooms</p>
          </div>
        </NuxtLink>

        <NuxtLink to="/admin/admins" class="group bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 hover:border-[#4d1979]/30 hover:shadow-sm transition-all">
          <div class="w-9 h-9 rounded-lg bg-black flex items-center justify-center shrink-0">
            <Icon name="eos-icons-admin" size="16" class="text-white" />
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-900">Administrators</p>
            <p class="text-xs text-gray-400 mt-0.5 leading-relaxed">View, invite, edit, and manage administrators</p>
          </div>
        </NuxtLink>

        <NuxtLink to="/admin/analytics" class="group bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 hover:border-[#4d1979]/30 hover:shadow-sm transition-all">
          <div class="w-9 h-9 rounded-lg bg-black flex items-center justify-center shrink-0">
            <Icon name="uim:analytics" size="16" class="text-white" />
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-900">Analytics</p>
            <p class="text-xs text-gray-400 mt-0.5 leading-relaxed">View assessment scores by category, case, and classroom</p>
          </div>
        </NuxtLink>

      </div>
    </div>

  </div>
</template>

<script setup>
import TotalCount from "@/components/ui/TotalCount.vue";

const { data: stats } = await useFetch('/api/admins/stats')

const user = computed(() => stats.value?.user || { name: 'Admin' })
const counts = computed(() => stats.value?.counts || {
  students: 0,
  instructors: 0,
  classrooms: 0,
  cases: 0
})
const latest = computed(() => stats.value?.latest || {
  students: null,
  instructors: null,
  classrooms: null,
  cases: null,
})

const formatLastAdded = (item) => {
  if (!item?.createdAt) return "No recent additions";

  const date = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (item?.name) return `Last added: ${item.name} · ${date}`;
  return `Last added: ${date}`;
};

const latestMeta = computed(() => ({
  students: formatLastAdded(latest.value.students),
  instructors: formatLastAdded(latest.value.instructors),
  classrooms: formatLastAdded(latest.value.classrooms),
  cases: formatLastAdded(latest.value.cases),
}))

const today = computed(() => {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})
</script>
