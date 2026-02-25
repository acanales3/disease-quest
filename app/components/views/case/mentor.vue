<template>
  <div class="flex flex-col h-[calc(100vh-80px)] bg-white">
    <!-- Header -->
    <div class="flex-shrink-0 border-b px-6 py-4">
      <div class="max-w-2xl mx-auto flex items-center justify-between">
        <div>
          <p class="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-medium">Pre-Encounter</p>
          <h1 class="text-base font-semibold text-neutral-900 mt-0.5">Mentor</h1>
        </div>
        <p v-if="session" class="text-xs text-neutral-400 font-mono">{{ session.elapsedMinutes }} min</p>
      </div>
    </div>

    <!-- Info -->
    <div class="flex-shrink-0 border-b bg-blue-50/40 px-6 py-2.5">
      <p class="max-w-2xl mx-auto text-xs text-neutral-500">
        Discuss your approach before meeting the patient. Ask about differentials, red flags, or how to structure your history.
      </p>
    </div>

    <!-- Chat -->
    <div class="flex-1 min-h-0 px-6 py-4" style="max-height: 60vh;">
      <div class="max-w-2xl mx-auto h-full">
        <CaseTextArea agent-type="tutor" :messages="tutorMessages" :loading="tutorLoading" :error-msg="error ?? ''"
          placeholder="Ask your mentor for guidance..." @send="handleSend" />
      </div>
    </div>

    <div class="flex-shrink-0 border-t px-6 py-3">
      <p class="max-w-2xl mx-auto text-[11px] text-neutral-400 text-center">
        Tip: Ask about systematic approach to a sick infant, key red flags, or how to prioritize your differential.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import CaseTextArea from '@/components/CaseTextArea/text-area.vue'
import { useCaseSession } from '@/composables/useCaseSession'

const route = useRoute()
const caseId = route.params.caseId as string
const { session, tutorMessages, tutorLoading, error, resumeSession, consultTutor } = useCaseSession()

onMounted(async () => {
  await resumeSession(parseInt(caseId))
})

async function handleSend(msg: string) { await consultTutor(msg) }
</script>
