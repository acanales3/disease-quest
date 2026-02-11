<template>
  <div class="min-h-[calc(100vh-80px)] bg-white flex justify-center py-12 px-6">
    <p v-if="pending" class="text-neutral-400 mt-20">Loading case...</p>
    <p v-else-if="fetchError" class="text-red-500 mt-20">{{ fetchError.message }}</p>

    <div v-else-if="caseData" class="w-full max-w-2xl space-y-10">

      <!-- Title -->
      <div class="text-center space-y-3">
        <p class="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-medium">Clinical Simulation</p>
        <h1 class="text-2xl font-bold text-neutral-900">{{ caseData.title ?? caseData.name }}</h1>
        <p class="text-sm text-neutral-500">
          {{ caseData.setting }}<span v-if="caseData.estimated_minutes"> &middot; ~{{ caseData.estimated_minutes }} min</span>
        </p>
        <div v-if="caseData.learner_level?.length" class="flex justify-center gap-2 pt-1">
          <span v-for="l in caseData.learner_level" :key="l"
            class="text-[10px] font-medium text-neutral-500 border border-neutral-200 rounded-full px-2.5 py-0.5">{{ l }}</span>
        </div>
      </div>

      <!-- Case Video -->
      <div v-if="videoUrl" class="rounded-xl overflow-hidden border border-neutral-200">
        <video
          :src="videoUrl"
          controls
          playsinline
          preload="metadata"
          class="w-full"
          poster=""
        >
          Your browser does not support the video tag.
        </video>
      </div>

      <hr class="border-neutral-100" />

      <!-- Story -->
      <div v-if="caseData.introduction_paragraphs?.length" class="space-y-5">
        <p v-for="(p, i) in caseData.introduction_paragraphs" :key="i"
          class="text-sm text-neutral-700 leading-7 text-justify">{{ p }}</p>
      </div>
      <p v-else-if="caseData.description" class="text-sm text-neutral-700 leading-7 text-justify">{{ caseData.description }}</p>

      <!-- Patient -->
      <div v-if="caseData.patient_name" class="border border-neutral-200 rounded-xl p-6">
        <p class="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-medium mb-4">Patient</p>
        <div class="grid grid-cols-2 gap-y-4 text-sm">
          <div>
            <p class="text-neutral-400 text-xs mb-0.5">Name</p>
            <p class="font-medium text-neutral-900">{{ caseData.patient_name }}</p>
          </div>
          <div>
            <p class="text-neutral-400 text-xs mb-0.5">Age</p>
            <p class="font-medium text-neutral-900">{{ caseData.patient_age }}</p>
          </div>
          <div class="col-span-2">
            <p class="text-neutral-400 text-xs mb-0.5">Chief Complaint</p>
            <p class="font-medium text-neutral-900">{{ caseData.chief_complaint }}</p>
          </div>
        </div>
      </div>

      <!-- Instructions -->
      <div v-if="caseData.introduction_instructions?.length" class="border border-blue-100 bg-blue-50/30 rounded-xl p-6">
        <p class="text-[10px] uppercase tracking-[0.2em] text-blue-600 font-medium mb-4">Your Task</p>
        <ol class="space-y-3">
          <li v-for="(inst, i) in caseData.introduction_instructions" :key="i" class="flex gap-3 text-sm text-neutral-700">
            <span class="w-5 h-5 rounded-full border border-blue-200 text-blue-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{{ i + 1 }}</span>
            <span>{{ inst }}</span>
          </li>
        </ol>
      </div>

      <!-- Start -->
      <div class="flex justify-center pt-4 pb-8">
        <button @click="startCase" :disabled="starting"
          class="px-10 py-3 bg-neutral-900 text-white rounded-lg font-medium text-sm hover:bg-neutral-800 transition disabled:opacity-50">
          {{ starting ? 'Starting...' : 'Begin Case' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCaseSession } from '@/composables/useCaseSession'

const route = useRoute()
const router = useRouter()
const caseId = route.params.caseId as string
const { createSession } = useCaseSession()
const starting = ref(false)

const { data: caseData, pending, error: fetchError } = useFetch(`/api/cases/${caseId}`)

// Video URL — from API if available, otherwise check Supabase storage
const videoUrl = computed(() => {
  const cd = caseData.value as Record<string, unknown> | null
  if (cd?.video_url) return cd.video_url as string
  if (cd?.introduction_video) return cd.introduction_video as string
  return null
})

async function startCase() {
  starting.value = true
  try {
    const sessionId = await createSession(parseInt(caseId))
    if (sessionId) { useState('currentSessionId', () => sessionId).value = sessionId; router.push(`/case/${caseId}/mentor`) }
  } finally { starting.value = false }
}
</script>
