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
import { ref, watch, nextTick, onUnmounted } from 'vue'
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
let currentUtterance: SpeechSynthesisUtterance | null = null
const ttsAudioCache = new Map<string, string>()
const ttsCacheOrder: string[] = []
const ttsInFlight = new Map<string, Promise<string | null>>()
const MAX_TTS_CACHE_ENTRIES = 40

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

function hashText(input: string): string {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function ttsKey(text: string, role: string): string {
  const voiceType = voiceTypeMap[role] ?? 'system'
  const normalized = text.trim()
  return `${voiceType}:${normalized.length}:${hashText(normalized)}`
}

function setTtsCache(key: string, audio: string) {
  if (!ttsAudioCache.has(key)) {
    ttsCacheOrder.push(key)
  }
  ttsAudioCache.set(key, audio)
  while (ttsCacheOrder.length > MAX_TTS_CACHE_ENTRIES) {
    const oldest = ttsCacheOrder.shift()
    if (oldest) ttsAudioCache.delete(oldest)
  }
}

async function fetchTtsAudio(text: string, role: string): Promise<string | null> {
  const normalized = text.trim()
  if (!normalized) return null

  const key = ttsKey(normalized, role)
  if (ttsAudioCache.has(key)) {
    return ttsAudioCache.get(key) || null
  }

  const existingRequest = ttsInFlight.get(key)
  if (existingRequest) return existingRequest

  const request = (async () => {
    try {
      const res = await $fetch<{ audio?: string | null }>('/api/tts', {
        method: 'POST',
        body: {
          text: normalized,
          voiceType: voiceTypeMap[role] ?? 'system',
        },
      })
      const audio = res.audio ?? null
      if (audio) setTtsCache(key, audio)
      return audio
    } catch {
      return null
    } finally {
      ttsInFlight.delete(key)
    }
  })()

  ttsInFlight.set(key, request)
  return request
}

async function warmVoiceCache(text: string, role: string) {
  await fetchTtsAudio(text, role)
}

async function playFromBase64(audio: string, idx: number) {
  const audioSrc = `data:audio/mpeg;base64,${audio}`
  currentAudio = new Audio(audioSrc)
  currentAudio.onended = () => {
    if (playingIdx.value === idx) playingIdx.value = null
    currentAudio = null
  }
  currentAudio.onerror = () => {
    if (playingIdx.value === idx) playingIdx.value = null
    currentAudio = null
  }
  await currentAudio.play()
}

async function playVoice(text: string, role: string, idx: number) {
  // If clicking the same message that's playing, stop it
  if (playingIdx.value === idx) {
    stopPlayback()
    playingIdx.value = null
    return
  }

  // Stop any other playing audio
  stopPlayback()

  playingIdx.value = idx

  try {
    const cachedAudio = await fetchTtsAudio(text, role)
    if (cachedAudio) {
      await playFromBase64(cachedAudio, idx)
      return
    }

    await playBrowserVoice(text, role, idx)
  } catch {
    await playBrowserVoice(text, role, idx)
  }
}

function stopPlayback() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  currentUtterance = null
}

async function playBrowserVoice(text: string, role: string, idx: number) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    playingIdx.value = null
    return
  }

  const speakableText = text.trim()
  if (!speakableText) {
    playingIdx.value = null
    return
  }

  const utterance = new SpeechSynthesisUtterance(speakableText)
  utterance.rate = role === 'tutor' || role === 'evaluator' ? 0.96 : 1
  utterance.pitch = role === 'patient' ? 1.05 : 1

  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find((v) =>
    role === 'patient'
      ? /female|samantha|victoria|zira/i.test(v.name)
      : /male|daniel|alex|david/i.test(v.name)
  )
  if (preferred) utterance.voice = preferred

  utterance.onend = () => {
    if (playingIdx.value === idx) playingIdx.value = null
    currentUtterance = null
  }
  utterance.onerror = () => {
    if (playingIdx.value === idx) playingIdx.value = null
    currentUtterance = null
  }

  currentUtterance = utterance
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
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

watch(
  () => props.messages.length,
  (newLen, oldLen = 0) => {
    if (newLen <= oldLen) return
    for (let i = oldLen; i < newLen; i += 1) {
      const msg = props.messages[i]
      if (msg && msg.role !== 'student') {
        void warmVoiceCache(msg.content, msg.role)
      }
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  stopPlayback()
  ttsAudioCache.clear()
  ttsCacheOrder.length = 0
  ttsInFlight.clear()
})
</script>
