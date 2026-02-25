<template>
  <div class="flex flex-col w-full max-w-2xl mx-auto" style="height: 100%; max-height: 100%;">
    <!-- Chat History -->
    <div
      ref="chatContainer"
      class="border rounded-lg p-4 overflow-y-auto bg-white space-y-3"
      style="flex: 1 1 0; min-height: 0;"
    >
      <template v-if="messages.length > 0">
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="flex"
          :class="msg.role === 'student' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm"
            :class="messageClass(msg.role)"
          >
            <div class="flex items-center justify-between gap-2 mb-1">
              <p class="text-[10px] font-semibold uppercase tracking-wider opacity-50">{{ roleLabel(msg.role) }}</p>
              <!-- Voice button for agent messages -->
              <button
                v-if="msg.role !== 'student'"
                @click="playVoice(msg.content, msg.role, idx)"
                class="opacity-40 hover:opacity-100 transition"
                :title="playingIdx === idx ? 'Stop' : 'Play voice'"
              >
                <svg v-if="playingIdx !== idx" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <svg v-else class="w-3.5 h-3.5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
              </button>
            </div>
            <p class="whitespace-pre-wrap leading-relaxed">{{ msg.content }}</p>
          </div>
        </div>
      </template>
      <p v-else class="text-neutral-400 italic text-center py-12 text-sm">
        {{ placeholder }}
      </p>

      <!-- Typing indicator -->
      <div v-if="loading" class="flex justify-start">
        <div class="rounded-xl px-3.5 py-2.5 text-sm bg-neutral-100">
          <p class="text-[10px] font-semibold mb-1 uppercase tracking-wider opacity-50">{{ agentLabel }}</p>
          <div class="flex gap-1 items-center py-1">
            <span class="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" style="animation-delay: 0ms"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" style="animation-delay: 150ms"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" style="animation-delay: 300ms"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="flex gap-2 mt-3 flex-shrink-0">
      <input
        v-model="userMessage"
        :placeholder="inputPlaceholder"
        class="flex-1 h-10 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        @keydown.enter.exact.prevent="send"
      />
      <button
        @click="send"
        :disabled="!userMessage.trim()"
        class="px-4 h-10 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium transition"
      >
        Send
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { ChatMessage } from '@/composables/useCaseSession'

const props = withDefaults(
  defineProps<{
    agentType?: 'patient' | 'tutor' | 'evaluator'
    messages?: ChatMessage[]
    loading?: boolean
    disabled?: boolean
    errorMsg?: string
    placeholder?: string
  }>(),
  {
    agentType: 'patient',
    messages: () => [],
    loading: false,
    disabled: false,
    errorMsg: '',
    placeholder: 'Responses will appear here...',
  }
)

const emit = defineEmits<{
  (e: 'send', message: string): void
}>()

const userMessage = ref('')
const chatContainer = ref<HTMLElement | null>(null)
const playingIdx = ref<number | null>(null)
let currentAudio: HTMLAudioElement | null = null

const agentLabel = props.agentType === 'tutor' ? 'Mentor' : props.agentType === 'evaluator' ? 'Evaluator' : 'Patient / Family'

const inputPlaceholder =
  props.agentType === 'tutor' ? 'Ask your mentor for guidance...'
  : props.agentType === 'evaluator' ? 'Ask about your performance...'
  : 'Ask the patient or their family...'

const voiceTypeMap: Record<string, string> = {
  patient: 'patient',
  tutor: 'tutor',
  system: 'system',
  evaluator: 'tutor',
  diagnostic: 'system',
}

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    student: 'You', patient: 'Patient / Family', tutor: 'Mentor',
    system: 'System', diagnostic: 'Lab', evaluator: 'Evaluator',
  }
  return labels[role] ?? role
}

function messageClass(role: string): string {
  const classes: Record<string, string> = {
    student: 'bg-neutral-900 text-white',
    patient: 'bg-neutral-100 text-neutral-800',
    tutor: 'bg-blue-50 text-blue-900',
    system: 'bg-amber-50 text-amber-900',
    diagnostic: 'bg-green-50 text-green-900',
    evaluator: 'bg-purple-50 text-purple-900',
  }
  return classes[role] ?? 'bg-neutral-100'
}

function send() {
  const msg = userMessage.value.trim()
  if (!msg) return
  emit('send', msg)
  userMessage.value = ''
}

async function playVoice(text: string, role: string, idx: number) {
  // If clicking the same message that's playing, stop it
  if (playingIdx.value === idx) {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      currentAudio = null
    }
    playingIdx.value = null
    return
  }

  // Stop any other playing audio
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }

  playingIdx.value = idx

  try {
    const res = await $fetch<{ audio: string }>('/api/tts', {
      method: 'POST',
      body: {
        text,
        voiceType: voiceTypeMap[role] ?? 'system',
      },
    })

    if (res.audio) {
      const audioSrc = `data:audio/mpeg;base64,${res.audio}`
      currentAudio = new Audio(audioSrc)
      currentAudio.onended = () => {
        playingIdx.value = null
        currentAudio = null
      }
      currentAudio.onerror = () => {
        playingIdx.value = null
        currentAudio = null
      }
      await currentAudio.play()
    }
  } catch {
    playingIdx.value = null
  }
}

// Auto-scroll on new messages or loading change
watch(
  [() => props.messages.length, () => props.loading],
  async () => {
    await nextTick()
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  }
)
</script>
