<template>
  <div class="min-h-[calc(100vh-80px)] bg-white flex justify-center py-12 px-6">

    <!-- ═══ LOADING / AGENT THINKING ═══ -->
    <div v-if="evaluating" class="w-full max-w-xl text-center space-y-8 pt-12">
      <div>
        <p class="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-medium">Case Complete</p>
        <h1 class="text-2xl font-bold text-neutral-900 mt-2">Generating Evaluation</h1>
        <p class="text-sm text-neutral-500 mt-1">Our evaluator agent is analyzing your performance...</p>
      </div>

      <div class="flex justify-center">
        <div class="w-10 h-10 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
      </div>

      <div class="text-left max-w-md mx-auto space-y-3">
        <div v-for="(step, i) in visibleSteps" :key="i" class="flex items-start gap-3 animate-fadeIn">
          <div class="mt-1 flex-shrink-0">
            <div v-if="i < visibleSteps.length - 1" class="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
              <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
            </div>
            <div v-else class="w-4 h-4 rounded-full border-2 border-neutral-300 border-t-neutral-700 animate-spin"></div>
          </div>
          <p class="text-sm" :class="i < visibleSteps.length - 1 ? 'text-neutral-500' : 'text-neutral-800 font-medium'">{{ step }}</p>
        </div>
      </div>

      <div class="max-w-md mx-auto">
        <div class="w-full bg-neutral-100 rounded-full h-1.5">
          <div class="bg-neutral-900 h-1.5 rounded-full transition-all duration-1000" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- ═══ EVALUATION RESULTS + DEBRIEF ═══ -->
    <div v-else-if="evaluation" class="w-full max-w-4xl animate-fadeIn">
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">

        <!-- LEFT: Scores (3 cols) -->
        <div class="lg:col-span-3 space-y-8">
          <div class="text-center space-y-2">
            <p class="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-medium">Case Complete</p>
            <h1 class="text-2xl font-bold text-neutral-900">Evaluation</h1>
          </div>

          <!-- Score ring -->
          <div class="flex justify-center">
            <div class="relative w-28 h-28">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#f3f4f6" stroke-width="6" />
                <circle cx="60" cy="60" r="52" fill="none" stroke-width="6" stroke-linecap="round"
                  :stroke="percentage >= 70 ? '#16a34a' : percentage >= 50 ? '#f59e0b' : '#ef4444'"
                  :stroke-dasharray="`${(percentage / 100) * 327} 327`" />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-2xl font-bold text-neutral-900">{{ percentage }}%</span>
                <span class="text-[10px] text-neutral-400">{{ evaluation.total_score ?? 0 }}/{{ evaluation.max_score ?? 100 }}</span>
              </div>
            </div>
          </div>

          <!-- Competencies -->
          <div v-if="competencyScores" class="space-y-4">
            <p class="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-medium">Competencies</p>
            <div v-for="(score, key) in competencyScores" :key="key" class="space-y-1">
              <div class="flex justify-between text-sm">
                <span class="text-neutral-700">{{ formatName(key as string) }}</span>
                <span class="font-mono text-xs text-neutral-400">{{ score.earned ?? 0 }}/{{ score.max ?? 15 }}</span>
              </div>
              <div class="w-full bg-neutral-100 rounded-full h-1.5">
                <div class="h-full rounded-full transition-all duration-700"
                  :class="barColor(score.earned ?? 0, score.max ?? 15)"
                  :style="{ width: `${Math.min(((score.earned ?? 0) / (score.max || 15)) * 100, 100)}%` }" />
              </div>
              <p v-if="score.feedback" class="text-xs text-neutral-500 leading-relaxed">{{ score.feedback }}</p>
            </div>
          </div>

          <!-- Strengths / Improvements -->
          <div class="grid grid-cols-2 gap-4">
            <div v-if="evalData?.strengths?.length" class="space-y-2">
              <p class="text-[10px] uppercase tracking-[0.2em] text-green-600 font-medium">Strengths</p>
              <ul class="space-y-1.5">
                <li v-for="(s, i) in evalData.strengths" :key="i" class="text-xs text-neutral-600 leading-relaxed">{{ s }}</li>
              </ul>
            </div>
            <div v-if="evalData?.improvements?.length" class="space-y-2">
              <p class="text-[10px] uppercase tracking-[0.2em] text-amber-600 font-medium">To Improve</p>
              <ul class="space-y-1.5">
                <li v-for="(s, i) in evalData.improvements" :key="i" class="text-xs text-neutral-600 leading-relaxed">{{ s }}</li>
              </ul>
            </div>
          </div>

          <!-- Missed Actions -->
          <div v-if="evalData?.missed_critical_actions?.length" class="border border-red-100 rounded-xl p-5 space-y-2">
            <p class="text-[10px] uppercase tracking-[0.2em] text-red-600 font-medium">Missed Critical Actions</p>
            <div v-for="(m, i) in evalData.missed_critical_actions" :key="i" class="space-y-0.5">
              <p class="text-sm font-medium text-neutral-800">{{ m.action }}</p>
              <p v-if="m.learning_point" class="text-xs text-blue-600 italic">{{ m.learning_point }}</p>
            </div>
          </div>

          <!-- Reflection -->
          <div v-if="evalData?.reflection_prompts?.length" class="border border-neutral-200 rounded-xl p-5 space-y-2">
            <p class="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-medium">Reflection Questions</p>
            <ol class="space-y-2 list-decimal list-inside">
              <li v-for="(r, i) in evalData.reflection_prompts" :key="i" class="text-sm text-neutral-600 leading-relaxed">
                {{ typeof r === 'string' ? r : r.prompt }}
              </li>
            </ol>
          </div>

          <!-- Overall -->
          <div v-if="evalData?.overall_feedback" class="space-y-2 pb-8">
            <p class="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-medium">Summary</p>
            <p class="text-sm text-neutral-600 leading-relaxed">{{ evalData.overall_feedback }}</p>
          </div>
        </div>

        <!-- RIGHT: Debrief Chat (2 cols) -->
        <div class="lg:col-span-2 flex flex-col border rounded-xl overflow-hidden" style="height: calc(100vh - 160px); position: sticky; top: 100px;">
          <!-- Header -->
          <div class="px-4 py-3 border-b bg-neutral-50 flex-shrink-0">
            <h3 class="text-sm font-semibold text-neutral-800">Debrief with Evaluator</h3>
            <p class="text-[11px] text-neutral-500">Ask about your scores, what you missed, or how to improve</p>
          </div>

          <!-- Messages -->
          <div ref="debriefContainer" class="flex-1 overflow-y-auto p-4 space-y-3" style="min-height: 0;">
            <!-- Welcome message -->
            <div v-if="debriefMessages.length === 0 && !debriefLoading" class="flex justify-start">
              <div class="max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm bg-purple-50 text-purple-900">
                <p class="text-[10px] font-semibold mb-1 uppercase tracking-wider opacity-50">Evaluator</p>
                <p class="leading-relaxed">Your evaluation is ready. I have full context of everything you did during the case. Ask me anything — why you lost points, what you should have done differently, or how to approach similar cases in the future.</p>
                <div class="mt-2 flex flex-wrap gap-1.5">
                  <button v-for="q in quickQuestions" :key="q" @click="debriefInput = q; sendDebrief()"
                    class="text-[11px] px-2.5 py-1 rounded-full border border-purple-200 text-purple-700 hover:bg-purple-100 transition">
                    {{ q }}
                  </button>
                </div>
              </div>
            </div>

            <div v-for="(msg, idx) in debriefMessages" :key="idx" class="flex" :class="msg.role === 'student' ? 'justify-end' : 'justify-start'">
              <div class="max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm" :class="msg.role === 'student' ? 'bg-neutral-900 text-white' : 'bg-purple-50 text-purple-900'">
                <p class="text-[10px] font-semibold mb-1 uppercase tracking-wider opacity-50">{{ msg.role === 'student' ? 'You' : 'Evaluator' }}</p>
                <div v-if="msg.role === 'evaluator'" class="whitespace-pre-wrap leading-relaxed prose-chat" v-html="formatMarkdown(msg.content)"></div>
                <p v-else class="whitespace-pre-wrap leading-relaxed">{{ msg.content }}</p>
              </div>
            </div>

            <!-- Typing indicator -->
            <div v-if="debriefLoading" class="flex justify-start">
              <div class="rounded-xl px-3.5 py-2.5 text-sm bg-purple-50">
                <p class="text-[10px] font-semibold mb-1 uppercase tracking-wider opacity-50">Evaluator</p>
                <div class="flex gap-1 items-center py-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style="animation-delay: 0ms"></span>
                  <span class="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style="animation-delay: 150ms"></span>
                  <span class="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style="animation-delay: 300ms"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Input -->
          <div class="flex gap-2 p-3 border-t flex-shrink-0">
            <input
              v-model="debriefInput"
              placeholder="Ask about your performance..."
              class="flex-1 h-9 px-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
              @keydown.enter.exact.prevent="sendDebrief"
            />
            <button @click="sendDebrief" :disabled="!debriefInput.trim() || debriefLoading"
              class="px-3 h-9 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-30 text-sm font-medium transition">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- No session -->
    <div v-else class="text-center mt-20 space-y-4">
      <p class="text-neutral-400">No evaluation available. Complete the case first.</p>
      <button @click="router.push(`/case/${caseId}/patient`)"
        class="px-6 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition">
        Return to Case
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const caseId = route.params.caseId as string

const evaluation = ref<Record<string, unknown> | null>(null)
const evaluating = ref(false)
const visibleSteps = ref<string[]>([])
const progressPercent = ref(0)

// Debrief chat
const debriefMessages = ref<Array<{ role: string; content: string }>>([])
const debriefInput = ref('')
const debriefLoading = ref(false)
const debriefContainer = ref<HTMLElement | null>(null)

const thinkingSteps = [
  "Loading interaction log and conversation history...",
  "Reviewing patient interview technique and questions asked...",
  "Analyzing physical examination findings identified...",
  "Evaluating diagnostic test ordering strategy...",
  "Checking test interpretation and clinical reasoning...",
  "Assessing differential diagnosis formulation...",
  "Reviewing treatment decisions and timing...",
  "Evaluating communication with patient family...",
  "Analyzing management plan and interventions...",
  "Comparing against clinical guidelines and rubric...",
  "Scoring competencies across all domains...",
  "Generating feedback and reflection prompts...",
  "Finalizing evaluation report...",
]

const evalData = computed(() => {
  if (!evaluation.value) return null
  return (evaluation.value.evaluation ?? evaluation.value) as Record<string, unknown>
})

const percentage = computed(() => (evaluation.value?.percentage ?? 0) as number)

const competencyScores = computed(() =>
  evalData.value?.competency_scores as Record<string, { earned: number; max: number; feedback?: string }> | null
)

const rubricDomains = computed(() => {
  if (!evaluation.value) return {} as Record<string, string>
  const domains = (evaluation.value.rubric_domains ?? []) as Array<{ id: string; name: string }>
  const map: Record<string, string> = {}
  for (const d of domains) map[d.id] = d.name
  return map
})

function formatName(k: string) {
  if (rubricDomains.value[k]) return rubricDomains.value[k]
  return k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function barColor(e: number, m: number) {
  const p = m > 0 ? (e / m) * 100 : 0
  return p >= 75 ? 'bg-green-500' : p >= 50 ? 'bg-amber-500' : 'bg-red-500'
}

// Simple markdown to HTML (bold, italic, numbered lists, bullet lists)
function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^(\d+)\.\s+/gm, '<span class="font-semibold text-purple-700">$1.</span> ')
    .replace(/^[-•]\s+/gm, '<span class="text-purple-400 mr-1">-</span> ')
}

const quickQuestions = [
  'Why this score?',
  'What did I miss?',
  'How to improve?',
]

// Debrief chat
async function sendDebrief() {
  const q = debriefInput.value.trim()
  if (!q || debriefLoading.value) return

  debriefMessages.value.push({ role: 'student', content: q })
  debriefInput.value = ''
  debriefLoading.value = true

  const sessionId = useState<string>('evaluationSessionId').value || useState<string>('currentSessionId').value

  try {
    const result = await $fetch<{ response: string }>(
      `/api/sessions/${sessionId}/debrief`,
      {
        method: 'POST',
        body: { question: q, evaluationData: evalData.value },
      }
    )
    debriefMessages.value.push({ role: 'evaluator', content: result.response })
  } catch {
    debriefMessages.value.push({ role: 'evaluator', content: 'Sorry, I couldn\'t process that. Please try again.' })
  } finally {
    debriefLoading.value = false
  }
}

// Auto-scroll debrief
watch(
  [() => debriefMessages.value.length, () => debriefLoading.value],
  async () => {
    await nextTick()
    if (debriefContainer.value) {
      debriefContainer.value.scrollTop = debriefContainer.value.scrollHeight
    }
  }
)

// Animate thinking steps
function animateSteps() {
  let stepIndex = 0
  const interval = setInterval(() => {
    if (stepIndex < thinkingSteps.length) {
      visibleSteps.value.push(thinkingSteps[stepIndex])
      progressPercent.value = Math.min(((stepIndex + 1) / thinkingSteps.length) * 95, 95)
      stepIndex++
    }
    if (evaluation.value && stepIndex < thinkingSteps.length) {
      while (stepIndex < thinkingSteps.length) {
        visibleSteps.value.push(thinkingSteps[stepIndex])
        stepIndex++
      }
      progressPercent.value = 100
      clearInterval(interval)
      setTimeout(() => { evaluating.value = false }, 600)
    }
    if (stepIndex >= thinkingSteps.length && evaluation.value) {
      progressPercent.value = 100
      clearInterval(interval)
      setTimeout(() => { evaluating.value = false }, 600)
    }
  }, 1800)
  return interval
}

onMounted(async () => {
  useState<Record<string, unknown> | null>('caseEvaluation', () => null).value = null

  let sessionId = useState<string>('evaluationSessionId').value
    || useState<string>('currentSessionId').value

  // Fallback: check localStorage or server for active session
  if (!sessionId && import.meta.client) {
    sessionId = localStorage.getItem(`dq_session_${caseId}`) ?? ''
  }
  if (!sessionId) {
    try {
      const res = await $fetch<{ sessionId: string | null }>(`/api/sessions/active?caseId=${caseId}`)
      sessionId = res.sessionId ?? ''
    } catch { /* no session */ }
  }

  if (!sessionId) return

  evaluating.value = true
  animateSteps()

  try {
    const result = await $fetch<Record<string, unknown>>(
      `/api/sessions/${sessionId}/action`,
      { method: 'POST', body: { actionType: 'end_case', payload: {} } }
    )
    if (result?.type === 'case_completed') {
      evaluation.value = result
      useState('caseEvaluation', () => result).value = result
    }
  } catch (err) {
    console.error('Evaluation failed:', err)
    evaluation.value = { error: true } as Record<string, unknown>
  }
})
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.4s ease-out forwards;
}
.prose-chat :deep(strong) {
  font-weight: 600;
  color: inherit;
}
.prose-chat :deep(em) {
  font-style: italic;
}
</style>
