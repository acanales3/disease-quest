<template>
  <div class="flex flex-col h-[calc(100vh-120px)] w-full bg-white">

    <!-- ═══ BEDSIDE MONITOR ═══ -->
    <div class="flex-shrink-0 monitor-body mt-4 mx-6 rounded-xl overflow-hidden">
      <!-- Monitor screen -->
      <div class="monitor-screen px-6 py-4 relative">

        <div class="flex items-end gap-8 max-w-screen-xl mx-auto relative z-10">

          <!-- Patient ID -->
          <div class="min-w-[140px] pb-0.5">
            <p class="text-[9px] uppercase tracking-[0.3em] text-neutral-500 mb-0.5">Patient</p>
            <p class="text-white text-sm font-semibold leading-tight truncate monitor-text">{{ session?.caseName ?? '—' }}</p>
            <p class="text-neutral-500 text-[10px] font-mono mt-1">
              <span class="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1 monitor-blink"></span>
              {{ displayElapsed }} min
            </p>
          </div>

          <!-- HR with waveform -->
          <div class="text-center relative">
            <svg class="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 opacity-40" viewBox="0 0 80 24">
              <polyline class="ecg-line" fill="none" :stroke="hrAlert ? '#ef4444' : '#4ade80'" stroke-width="1.5"
                points="0,12 10,12 15,12 18,4 20,20 22,8 25,12 35,12 45,12 48,4 50,20 52,8 55,12 65,12 75,12 80,12" />
            </svg>
            <p class="text-[9px] uppercase tracking-[0.2em] text-green-500/70 mb-1">HR</p>
            <p class="font-mono text-3xl font-bold leading-none tabular-nums monitor-text"
              :class="hrAlert ? 'text-red-500 monitor-alert' : 'text-green-400'">
              {{ session?.vitals?.hr_bpm ?? '—' }}
            </p>
            <p class="text-[9px] text-neutral-600 mt-0.5">bpm</p>
          </div>

          <!-- BP -->
          <div class="text-center">
            <p class="text-[9px] uppercase tracking-[0.2em] text-red-400/70 mb-1">NBP</p>
            <p class="font-mono text-3xl font-bold leading-none tabular-nums monitor-text"
              :class="bpAlert ? 'text-red-500 monitor-alert' : 'text-red-400'">
              {{ session?.vitals?.bp_systolic ?? '—' }}<span class="text-lg opacity-50">/</span>{{ session?.vitals?.bp_diastolic ?? '—' }}
            </p>
            <p class="text-[9px] text-neutral-600 mt-0.5">mmHg</p>
          </div>

          <!-- SpO2 -->
          <div class="text-center">
            <p class="text-[9px] uppercase tracking-[0.2em] text-cyan-400/70 mb-1">SpO2</p>
            <p class="font-mono text-3xl font-bold leading-none tabular-nums monitor-text"
              :class="spo2Alert ? 'text-red-500 monitor-alert' : 'text-cyan-400'">
              {{ session?.vitals?.spo2_percent ?? '—' }}
            </p>
            <p class="text-[9px] text-neutral-600 mt-0.5">%</p>
          </div>

          <!-- Temp -->
          <div class="text-center">
            <p class="text-[9px] uppercase tracking-[0.2em] text-yellow-400/70 mb-1">Temp</p>
            <p class="font-mono text-3xl font-bold leading-none tabular-nums monitor-text"
              :class="tempAlert ? 'text-red-500 monitor-alert' : 'text-yellow-400'">
              {{ session?.vitals?.temp_f ?? '—' }}
            </p>
            <p class="text-[9px] text-neutral-600 mt-0.5">°F</p>
          </div>

          <!-- RR -->
          <div class="text-center">
            <p class="text-[9px] uppercase tracking-[0.2em] text-white/40 mb-1">RR</p>
            <p class="font-mono text-2xl font-bold leading-none tabular-nums text-white/80 monitor-text">
              {{ session?.vitals?.rr_bpm ?? '—' }}
            </p>
            <p class="text-[9px] text-neutral-600 mt-0.5">/min</p>
          </div>

          <!-- Cap Refill -->
          <div class="text-center">
            <p class="text-[9px] uppercase tracking-[0.2em] text-white/40 mb-1">Cap Refill</p>
            <p class="font-mono text-2xl font-bold leading-none tabular-nums monitor-text"
              :class="crAlert ? 'text-red-500 monitor-alert' : 'text-white/80'">
              {{ session?.vitals?.cap_refill_sec ?? '—' }}
            </p>
            <p class="text-[9px] text-neutral-600 mt-0.5">sec</p>
          </div>

          <div class="flex-1"></div>

          <!-- Status / Alerts -->
          <div class="flex flex-col items-end gap-1.5 pb-0.5">
            <span class="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
              {{ session?.patientStatus?.mentalStatus ?? '' }}
            </span>
            <div v-if="session?.patientStatus?.hasShock" class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-red-500 monitor-blink"></span>
              <span class="text-red-500 text-[10px] font-bold uppercase tracking-widest font-mono monitor-alert">Shock</span>
            </div>
            <div v-if="session?.patientStatus?.hasSeizure" class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-red-500 monitor-blink"></span>
              <span class="text-red-500 text-[10px] font-bold uppercase tracking-widest font-mono monitor-alert">Seizure</span>
            </div>
          </div>
        </div>
      </div>
      <!-- Monitor bezel bottom -->
      <div class="h-1.5 bg-gradient-to-b from-neutral-800 to-neutral-900"></div>
    </div>

    <!-- Deterioration -->
    <div v-if="deteriorationAlert" class="flex-shrink-0 bg-red-600 text-white text-sm font-medium px-6 py-2 text-center animate-pulse">
      Patient Deterioration — {{ deteriorationAlert }}
    </div>

    <!-- ═══ ACTION BAR ═══ -->
    <div class="flex-shrink-0 border-b bg-neutral-50 px-6">
      <div class="max-w-screen-xl mx-auto flex items-center justify-between py-2">
        <div class="flex items-center gap-1">
          <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
            class="px-4 py-2 text-xs font-medium rounded-md transition"
            :class="activeTab === tab.id
              ? 'bg-white text-neutral-900 shadow-sm border'
              : 'text-neutral-500 hover:text-neutral-700 hover:bg-white/60'">
            {{ tab.label }}
          </button>
        </div>
        <div class="flex items-center gap-2">
          <button @click="advanceTime(5)" :disabled="loading"
            class="text-xs px-3 py-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-white transition disabled:opacity-40">
            +5 min
          </button>
          <button @click="showMentor = true"
            class="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition">
            Ask Mentor
          </button>
          <button @click="handleEndCase" :disabled="loading"
            class="text-xs px-3 py-1.5 rounded-md text-neutral-400 hover:text-red-600 transition disabled:opacity-40">
            End Case
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ CONTENT ═══ -->
    <div class="flex-1 min-h-0 flex flex-col">

      <!-- INTERVIEW -->
      <div v-if="activeTab === 'interview'" class="flex-1 min-h-0 max-w-2xl mx-auto w-full px-6 py-4" style="max-height: 60vh;">
        <CaseTextArea
          agent-type="patient"
          :messages="patientMessages"
          :loading="patientLoading"
          :error-msg="error ?? ''"
          placeholder="Ask the patient's family a question..."
          @send="handlePatientChat"
        />
      </div>

      <!-- Other tabs (scrollable) -->
      <div v-else class="flex-1 overflow-y-auto">
      <div class="max-w-screen-lg mx-auto py-6 px-6">

        <!-- EXAM -->
        <div v-if="activeTab === 'exam'" class="max-w-2xl mx-auto space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-neutral-800">Physical Examination</h2>
            <button @click="handleExam" :disabled="loading"
              class="px-5 py-2 text-sm font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition">
              {{ loading ? 'Examining...' : 'Examine Patient' }}
            </button>
          </div>

          <template v-if="examFindings">
            <!-- Hospital-style PE report -->
            <div class="border border-neutral-300 bg-white font-serif">
              <!-- Header -->
              <div class="border-b border-neutral-300 px-6 py-3 bg-neutral-50 flex justify-between items-center">
                <div>
                  <p class="text-xs font-bold uppercase tracking-wider text-neutral-600">Physical Examination Report</p>
                  <p class="text-[10px] text-neutral-400 mt-0.5">Emergency Department</p>
                </div>
                <div class="text-right text-[10px] text-neutral-400">
                  <p>Patient: {{ session?.caseName ?? 'Thompson, Amelia' }}</p>
                  <p>Time: {{ displayElapsed }} min</p>
                </div>
              </div>

              <!-- Vitals -->
              <div class="border-b border-neutral-200 px-6 py-3">
                <p class="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">Vital Signs</p>
                <div class="grid grid-cols-3 gap-x-8 gap-y-1 text-sm">
                  <div v-for="(val, key) in examFindings.vitals" :key="key" class="flex justify-between">
                    <span class="text-neutral-500">{{ formatLabel(key as string) }}:</span>
                    <span class="font-medium" :class="isAbnormal(String(val)) ? 'text-red-700' : 'text-neutral-900'">{{ val }}</span>
                  </div>
                </div>
              </div>

              <!-- Systems -->
              <div class="px-6 py-3 space-y-3 text-sm">
                <div v-if="examFindings.general_appearance">
                  <span class="font-bold text-neutral-700">GENERAL: </span>
                  <span class="text-neutral-600">{{ examFindings.general_appearance }}</span>
                </div>
                <div v-if="examFindings.skin">
                  <span class="font-bold text-neutral-700">SKIN: </span>
                  <span class="text-neutral-600">{{ examFindings.skin.rash ?? 'Unremarkable' }}</span>
                  <span v-if="examFindings.skin.other_findings?.length" class="text-neutral-500">; {{ examFindings.skin.other_findings.join('; ') }}</span>
                </div>
                <div v-if="examFindings.neurological?.length">
                  <span class="font-bold text-neutral-700">NEURO: </span>
                  <span class="text-neutral-600">{{ examFindings.neurological.join(', ').replace(/_/g, ' ') }}</span>
                </div>
                <div v-if="examFindings.mental_status">
                  <span class="font-bold text-neutral-700">MENTAL STATUS: </span>
                  <span class="text-neutral-600 capitalize">{{ examFindings.mental_status }}</span>
                </div>
              </div>
            </div>
          </template>
          <p v-else class="text-sm text-neutral-400 text-center py-12">Click "Examine Patient" to perform a physical examination.</p>
        </div>

        <!-- ORDERS -->
        <div v-if="activeTab === 'orders'" class="max-w-3xl mx-auto">
          <div class="grid grid-cols-2 gap-8">
            <!-- Order column -->
            <div>
              <h2 class="text-base font-semibold text-neutral-800 mb-4">Order Tests</h2>
              <div class="space-y-1.5">
                <button v-for="test in availableTests" :key="test.id"
                  @click="handleOrderTest(test.id)"
                  :disabled="loading || orderedTestIds.has(test.id)"
                  class="w-full flex items-center justify-between px-4 py-3 text-sm rounded-lg border transition text-left"
                  :class="orderedTestIds.has(test.id)
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-white hover:bg-neutral-50 border-neutral-200'">
                  <span>{{ test.name }}</span>
                  <span v-if="orderedTestIds.has(test.id)" class="text-[10px] font-semibold uppercase text-green-600">Ordered</span>
                  <span v-else class="text-[10px] text-neutral-400">{{ test.cost_points }} pts</span>
                </button>
              </div>
            </div>
            <!-- Results column - hospital lab report style -->
            <div>
              <h2 class="text-base font-semibold text-neutral-800 mb-4">Results</h2>
              <div v-if="testResultsList.length === 0" class="text-sm text-neutral-400 italic py-4">
                No results yet.
              </div>
              <div v-for="r in testResultsList" :key="r.testId" class="border border-neutral-300 bg-white mb-4">
                <!-- Lab report header -->
                <div class="border-b border-neutral-300 px-4 py-2 bg-neutral-50 flex justify-between items-center cursor-pointer" @click="toggleResult(r.testId)">
                  <p class="text-xs font-bold uppercase tracking-wider text-neutral-600">{{ r.testName }}</p>
                  <span class="text-neutral-400 text-xs">{{ expandedResults.has(r.testId) ? '▾' : '▸' }}</span>
                </div>
                <!-- Lab values table -->
                <div v-if="expandedResults.has(r.testId)">
                  <table class="w-full text-xs">
                    <thead>
                      <tr class="border-b border-neutral-200 bg-neutral-50/50">
                        <th class="text-left px-4 py-1.5 font-semibold text-neutral-500 uppercase tracking-wider">Component</th>
                        <th class="text-right px-4 py-1.5 font-semibold text-neutral-500 uppercase tracking-wider">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(val, key) in r.data" :key="key" class="border-b border-neutral-100 last:border-0">
                        <td class="px-4 py-1.5 text-neutral-600">{{ formatLabel(key as string) }}</td>
                        <td class="px-4 py-1.5 text-right font-mono"
                          :class="isAbnormal(formatResultVal(val)) ? 'text-red-700 font-bold' : 'text-neutral-800'">
                          {{ formatResultVal(val) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TREATMENT -->
        <div v-if="activeTab === 'treatment'" class="max-w-2xl mx-auto">
          <h2 class="text-base font-semibold text-neutral-800 mb-4">Interventions</h2>
          <div class="space-y-1.5">
            <button v-for="i in availableInterventions" :key="i.id"
              @click="handleTreatment(i.name)"
              :disabled="loading || administeredTreatments.has(i.name)"
              class="w-full flex items-center justify-between px-4 py-3 text-sm rounded-lg border transition text-left"
              :class="administeredTreatments.has(i.name)
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-white hover:bg-neutral-50 border-neutral-200'">
              <span>{{ i.name }}</span>
              <span v-if="administeredTreatments.has(i.name)" class="text-[10px] font-semibold uppercase text-green-600">Administered</span>
            </button>
          </div>
        </div>

        <!-- DIFFERENTIAL -->
        <div v-if="activeTab === 'differential'" class="max-w-2xl mx-auto space-y-5">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-neutral-800">Differential Diagnosis</h2>
            <button @click="addDifferentialRow"
              class="text-xs px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition">
              + Add
            </button>
          </div>

          <!-- Differential rows -->
          <div v-if="differentialRows.length === 0" class="text-sm text-neutral-400 text-center py-8">
            Click "+ Add" to build your differential diagnosis list.
          </div>
          <div v-for="(row, idx) in differentialRows" :key="idx" class="border rounded-lg p-4 space-y-3 relative">
            <button @click="removeDifferentialRow(idx)"
              class="absolute top-2 right-2 text-neutral-300 hover:text-red-500 transition text-xs">
              &times;
            </button>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] uppercase tracking-wider text-neutral-400 mb-1 block">Diagnosis</label>
                <input v-model="row.diagnosis" placeholder="e.g. Bacterial meningitis"
                  class="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-neutral-400 mb-1 block">Likelihood</label>
                <select v-model="row.likelihood"
                  class="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-neutral-400 mb-1 block">Reasoning</label>
              <input v-model="row.reasoning" placeholder="Why you think this..."
                class="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>

          <button v-if="differentialRows.length > 0" @click="handleSubmitDifferential" :disabled="loading || differentialRows.every(r => !r.diagnosis.trim())"
            class="w-full py-3 text-sm font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition">
            {{ differentialSubmitted ? 'Update Differential' : 'Submit Differential' }}
          </button>

          <!-- Previously submitted -->
          <div v-if="session?.differentialHistory?.length" class="border-t pt-4 mt-4 space-y-3">
            <p class="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">History</p>
            <div v-for="(entry, i) in session.differentialHistory" :key="i" class="text-xs text-neutral-500 space-y-1">
              <p class="font-medium text-neutral-600">At {{ (entry as any).timestamp_minutes }} min:</p>
              <div v-for="(dx, j) in (entry as any).diagnoses" :key="j" class="flex gap-2 pl-3">
                <span class="font-mono">{{ j + 1 }}.</span>
                <span>{{ dx.diagnosis }}</span>
                <span class="text-neutral-400">({{ dx.likelihood }})</span>
              </div>
            </div>
          </div>
        </div>

        <!-- DIAGNOSIS -->
        <div v-if="activeTab === 'diagnosis'" class="max-w-lg mx-auto space-y-5">
          <h2 class="text-base font-semibold text-neutral-800">Final Diagnosis</h2>
          <div>
            <label class="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">Diagnosis</label>
            <input v-model="diagnosisText" placeholder="Your diagnosis..."
              class="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label class="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">Clinical Reasoning</label>
            <textarea v-model="diagnosisReasoning" placeholder="Explain your reasoning..."
              class="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <button @click="handleSubmitDiagnosis" :disabled="loading || !diagnosisText.trim()"
            class="w-full py-3 text-sm font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition">
            Submit Diagnosis
          </button>
        </div>
      </div>
      </div>
    </div>

    <!-- ═══ MENTOR DRAWER ═══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showMentor" @click="showMentor = false" class="fixed inset-0 bg-black/10 z-40"></div>
      </Transition>
      <Transition name="slide">
        <div v-if="showMentor" class="fixed inset-y-0 right-0 w-[460px] bg-white border-l shadow-xl z-50 flex flex-col">
          <div class="flex items-center justify-between px-5 py-4 border-b">
            <h3 class="text-sm font-semibold text-neutral-800">Mentor</h3>
            <button @click="showMentor = false"
              class="w-7 h-7 rounded-md flex items-center justify-center hover:bg-neutral-100 text-neutral-400 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="flex-1 overflow-hidden p-4">
            <CaseTextArea agent-type="tutor" :messages="tutorMessages" :loading="tutorLoading" :error-msg="error ?? ''"
              placeholder="Ask your mentor..." @send="handleMentorChat" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CaseTextArea from '@/components/CaseTextArea/text-area.vue'
import { useCaseSession } from '@/composables/useCaseSession'

const route = useRoute()
const router = useRouter()
const caseId = route.params.caseId as string

const {
  session, patientMessages, tutorMessages, patientLoading, tutorLoading, actionLoading, error, displayElapsed,
  resumeSession, askPatient, performExam,
  orderTest, getResults, administerTreatment,
  consultTutor, updateDifferential, submitDiagnosis, advanceTime, endCase,
} = useCaseSession()

const loading = actionLoading

const activeTab = ref<'interview' | 'exam' | 'orders' | 'treatment' | 'differential' | 'diagnosis'>('interview')
const showMentor = ref(false)
const diagnosisText = ref('')
const diagnosisReasoning = ref('')
const differentialRows = ref<Array<{ diagnosis: string; likelihood: string; reasoning: string }>>([])
const differentialSubmitted = ref(false)
const deteriorationAlert = ref<string | null>(null)
const orderedTestIds = ref(new Set<string>())
const administeredTreatments = ref(new Set<string>())
const examFindings = ref<Record<string, unknown> | null>(null)
const testResultsList = ref<Array<{ testId: string; testName: string; data: Record<string, unknown> }>>([])
const expandedResults = ref(new Set<string>())

const tabs = [
  { id: 'interview' as const, label: 'Interview' },
  { id: 'exam' as const, label: 'Exam' },
  { id: 'orders' as const, label: 'Orders' },
  { id: 'treatment' as const, label: 'Treatment' },
  { id: 'differential' as const, label: 'DDx' },
  { id: 'diagnosis' as const, label: 'Diagnosis' },
]

// Alert helpers
const hrAlert = computed(() => (session.value?.vitals?.hr_bpm ?? 0) > 160)
const bpAlert = computed(() => (session.value?.vitals?.bp_systolic ?? 999) < 60)
const spo2Alert = computed(() => (session.value?.vitals?.spo2_percent ?? 100) < 92)
const tempAlert = computed(() => (session.value?.vitals?.temp_f ?? 0) >= 103)
const crAlert = computed(() => (session.value?.vitals?.cap_refill_sec ?? 0) > 4)

const { data: caseData } = useFetch(`/api/cases/${caseId}`)
const availableTests = computed(() => (caseData.value as Record<string, unknown>)?.available_tests as Array<{ id: string; name: string; cost_points: number }> ?? [])
const availableInterventions = computed(() => (caseData.value as Record<string, unknown>)?.available_interventions as Array<{ id: string; name: string }> ?? [])

onMounted(async () => {
  await resumeSession(parseInt(caseId))
  if (session.value?.sessionId) {
    await restoreHistory(session.value.sessionId)
  }
})

async function restoreHistory(sessionId: string) {
  try {
    const h = await $fetch<{
      orderedTests: string[]
      testResults: Array<{ testId: string; testName: string; data: Record<string, unknown> }>
      treatments: string[]
      examFindings: Record<string, unknown> | null
    }>(`/api/sessions/${sessionId}/history`)

    // Restore ordered tests
    for (const t of h.orderedTests) orderedTestIds.value.add(t)

    // Restore test results
    for (const r of h.testResults) {
      if (!testResultsList.value.find(x => x.testId === r.testId)) {
        testResultsList.value.push(r)
        expandedResults.value.add(r.testId)
      }
    }

    // Restore treatments
    for (const t of h.treatments) administeredTreatments.value.add(t)

    // Restore exam findings
    if (h.examFindings) examFindings.value = h.examFindings

    // Restore differential from session
    if (session.value?.differentialHistory?.length) {
      const latest = session.value.differentialHistory[session.value.differentialHistory.length - 1] as { diagnoses: Array<{ diagnosis: string; likelihood: string; reasoning?: string }> }
      differentialRows.value = latest.diagnoses.map(d => ({
        diagnosis: d.diagnosis,
        likelihood: d.likelihood ?? 'medium',
        reasoning: d.reasoning ?? '',
      }))
      differentialSubmitted.value = true
    }
  } catch {
    // Non-critical — UI just won't have history
  }
}

async function handlePatientChat(msg: string) { checkForAlerts(await askPatient(msg)) }
async function handleMentorChat(msg: string) { await consultTutor(msg) }

async function handleExam() {
  const r = await performExam('complete')
  if (r?.findings) { examFindings.value = r.findings as Record<string, unknown>; activeTab.value = 'exam' }
  checkForAlerts(r)
}

async function handleOrderTest(testId: string) {
  const r = await orderTest(testId)
  if (r?.success) {
    orderedTestIds.value.add(testId)
    // Fetch results after a short delay (tests have 1-min TAT but simulation time advances)
    fetchResultsWithRetry(testId, r?.test_name as string ?? testId)
  }
  checkForAlerts(r)
}

async function fetchResultsWithRetry(testId: string, testName: string, attempts = 0) {
  if (attempts > 5) return // give up after 5 tries

  // Wait a bit, then try to get results
  await new Promise(resolve => setTimeout(resolve, attempts === 0 ? 2000 : 3000))

  // Advance time by 1 min so the TAT is met
  if (attempts === 0) {
    await advanceTime(1)
  }

  const res = await getResults(testId)
  if (res?.status === 'complete' && res?.results) {
    const d = { ...res.results as Record<string, unknown> }
    delete d.interpretation
    delete d.wbc_value
    // Avoid duplicates
    if (!testResultsList.value.find(r => r.testId === testId)) {
      testResultsList.value.push({ testId, testName, data: d })
      expandedResults.value.add(testId)
    }
  } else if (res?.status === 'pending') {
    // Try again
    fetchResultsWithRetry(testId, testName, attempts + 1)
  }
}

function toggleResult(id: string) { expandedResults.value.has(id) ? expandedResults.value.delete(id) : expandedResults.value.add(id) }
async function handleTreatment(t: string) { const r = await administerTreatment(t); if (r) administeredTreatments.value.add(t); checkForAlerts(r) }

function addDifferentialRow() {
  differentialRows.value.push({ diagnosis: '', likelihood: 'medium', reasoning: '' })
}
function removeDifferentialRow(idx: number) {
  differentialRows.value.splice(idx, 1)
}
async function handleSubmitDifferential() {
  const valid = differentialRows.value.filter(r => r.diagnosis.trim())
  if (valid.length === 0) return
  await updateDifferential(valid)
  differentialSubmitted.value = true
}

async function handleSubmitDiagnosis() { await submitDiagnosis(diagnosisText.value, diagnosisReasoning.value) }

async function handleEndCase() {
  // Navigate immediately — evaluation page handles the API call with loading UI
  useState('evaluationSessionId', () => session.value?.sessionId ?? '').value = session.value?.sessionId ?? ''
  router.push(`/case/${caseId}/evaluation`)
}

function checkForAlerts(r: Record<string, unknown> | null) {
  if (!r) return
  if (r.deterioration_events) { deteriorationAlert.value = (r.deterioration_events as string[]).join(' | '); setTimeout(() => { deteriorationAlert.value = null }, 15000) }
}

function formatLabel(k: string) { return k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }
function isAbnormal(v: string) { return typeof v === 'string' && /HIGH|LOW|LEFT SHIFT|POSITIVE/i.test(v) }
function formatResultVal(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'object') {
    // Format nested objects like susceptibilities as key: value lines
    return Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => `${formatLabel(k)}: ${v}`)
      .join(' | ')
  }
  return String(val)
}
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: transform 0.2s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Monitor styles ── */
.monitor-body {
  background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
}
.monitor-screen {
  background: #0a0a0a;
  position: relative;
}
/* Clean crisp text - no glow */
.monitor-text {
  text-shadow: none;
}
/* Alert flash */
.monitor-alert {
  animation: alertFlash 1s ease-in-out infinite;
}
@keyframes alertFlash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
/* Blinking dot */
.monitor-blink {
  animation: blink 1.2s ease-in-out infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}
/* ECG waveform animation */
.ecg-line {
  stroke-dasharray: 200;
  stroke-dashoffset: 200;
  animation: ecgDraw 2s linear infinite;
}
@keyframes ecgDraw {
  to { stroke-dashoffset: 0; }
}
/* Pleth waveform animation */
.pleth-line {
  stroke-dasharray: 200;
  stroke-dashoffset: 200;
  animation: plethDraw 1.5s linear infinite;
}
@keyframes plethDraw {
  to { stroke-dashoffset: 0; }
}
</style>
