<template>
  <div class="min-h-[calc(100vh-80px)] bg-white flex justify-center py-12 px-6">
    <p v-if="pending" class="text-neutral-400 mt-20">Loading case...</p>
    <p v-else-if="fetchError" class="text-red-500 mt-20">
      {{ fetchError.message }}
    </p>

    <div v-else-if="caseData" class="w-full max-w-2xl space-y-10">
      <!-- Title -->
      <div class="text-center space-y-3">
        <p
          class="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-medium"
        >
          Clinical Simulation
        </p>
        <h1 class="text-2xl font-bold text-neutral-900">
          {{ caseData.title ?? caseData.name }}
        </h1>
        <p class="text-sm text-neutral-500">
          {{ caseData.setting
          }}<span v-if="caseData.estimated_minutes">
            &middot; ~{{ caseData.estimated_minutes }} min</span
          >
        </p>
        <div
          v-if="caseData.learner_level?.length"
          class="flex justify-center gap-2 pt-1"
        >
          <span
            v-for="l in caseData.learner_level"
            :key="l"
            class="text-[10px] font-medium text-neutral-500 border border-neutral-200 rounded-full px-2.5 py-0.5"
            >{{ l }}</span
          >
        </div>
      </div>

      <!-- Case Video -->
      <div
        v-if="videoUrl"
        class="rounded-xl overflow-hidden border border-neutral-200"
      >
        <video
          :src="videoUrl"
          controls
          playsinline
          preload="metadata"
          class="w-full"
        >
          Your browser does not support the video tag.
        </video>
      </div>

      <hr class="border-neutral-100" />

      <!-- Story -->
      <div v-if="caseData.introduction_paragraphs?.length" class="space-y-5">
        <p
          v-for="(p, i) in caseData.introduction_paragraphs"
          :key="i"
          class="text-sm text-neutral-700 leading-7 text-justify"
        >
          {{ p }}
        </p>
      </div>
      <p
        v-else-if="caseData.description"
        class="text-sm text-neutral-700 leading-7 text-justify"
      >
        {{ caseData.description }}
      </p>

      <!-- Patient -->
      <div
        v-if="caseData.patient_name"
        class="border border-neutral-200 rounded-xl p-6"
      >
        <p
          class="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-medium mb-4"
        >
          Patient
        </p>
        <div class="grid grid-cols-2 gap-y-4 text-sm">
          <div>
            <p class="text-neutral-400 text-xs mb-0.5">Name</p>
            <p class="font-medium text-neutral-900">
              {{ caseData.patient_name }}
            </p>
          </div>
          <div>
            <p class="text-neutral-400 text-xs mb-0.5">Age</p>
            <p class="font-medium text-neutral-900">
              {{ caseData.patient_age }}
            </p>
          </div>
          <div class="col-span-2">
            <p class="text-neutral-400 text-xs mb-0.5">Chief Complaint</p>
            <p class="font-medium text-neutral-900">
              {{ caseData.chief_complaint }}
            </p>
          </div>
        </div>
      </div>

      <!-- Instructions -->
      <div
        v-if="caseData.introduction_instructions?.length"
        class="border border-blue-100 bg-blue-50/30 rounded-xl p-6"
      >
        <p
          class="text-[10px] uppercase tracking-[0.2em] text-blue-600 font-medium mb-4"
        >
          Your Task
        </p>
        <ol class="space-y-3">
          <li
            v-for="(inst, i) in caseData.introduction_instructions"
            :key="i"
            class="flex gap-3 text-sm text-neutral-700"
          >
            <span
              class="w-5 h-5 rounded-full border border-blue-200 text-blue-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
              >{{ i + 1 }}</span
            >
            <span>{{ inst }}</span>
          </li>
        </ol>
      </div>

      <!-- Session error -->
      <div
        v-if="startError"
        class="border border-red-200 bg-red-50 rounded-xl p-4 text-center"
      >
        <p class="text-sm text-red-700 font-medium">Failed to start case</p>
        <p class="text-xs text-red-500 mt-1">{{ startError }}</p>
      </div>

      <!-- CTA: completed state (no active session, replay needed) -->
      <div
        v-if="sessionState === 'completed'"
        class="border border-green-200 bg-green-50/40 rounded-xl p-5 text-center space-y-4"
      >
        <p class="text-sm text-green-800 font-medium">
          You've already completed this case.
        </p>
        <div class="flex justify-center gap-3">
          <button
            @click="router.push(`/case/${caseId}/results`)"
            class="px-6 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg font-medium text-sm hover:bg-neutral-50 transition"
          >
            Review Results
          </button>
          <button
            @click="handleReplay"
            :disabled="starting"
            class="px-6 py-2.5 bg-neutral-900 text-white rounded-lg font-medium text-sm hover:bg-neutral-800 transition disabled:opacity-50"
          >
            {{ starting ? "Starting..." : "Replay Case" }}
          </button>
        </div>
      </div>

      <!-- CTA: normal begin / continue -->
      <div v-else class="flex justify-center pt-4 pb-8">
        <button
          @click="handleStart"
          :disabled="starting || sessionState === 'loading'"
          class="px-10 py-3 bg-neutral-900 text-white rounded-lg font-medium text-sm hover:bg-neutral-800 transition disabled:opacity-50"
        >
          <span v-if="starting || sessionState === 'loading'">Loading...</span>
          <span v-else-if="sessionState === 'resume'">Continue Case</span>
          <span v-else>Begin Case</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCaseSession } from "@/composables/useCaseSession";

const route = useRoute();
const router = useRouter();
const caseId = route.params.caseId as string;

const {
  resumeSession,
  startReplay,
  session,
  error: sessionError,
} = useCaseSession();

const starting = ref(false);
const startError = ref<string | null>(null);
// 'loading' | 'new' | 'resume' | 'completed'
const sessionState = ref<"loading" | "new" | "resume" | "completed">("loading");
// The resolved session ID to navigate into the game with
const resolvedSessionId = ref<string | null>(null);

const {
  data: caseData,
  pending,
  error: fetchError,
} = useFetch(`/api/cases/${caseId}`);

const videoUrl = computed(() => {
  const cd = caseData.value as Record<string, unknown> | null;
  if (cd?.video_url) return cd.video_url as string;
  if (cd?.introduction_video) return cd.introduction_video as string;
  return null;
});

// ── Resolve session on mount ──────────────────────────────────────────────────
// We check if there's an existing active session for this case.
// The URL may already have ?session= if the user navigated back from the game.
onMounted(async () => {
  const urlSessionId = route.query.session as string | undefined;

  const existingId = await resumeSession(parseInt(caseId), urlSessionId);

  if (existingId) {
    // Active session found — offer "Continue"
    resolvedSessionId.value = existingId;
    sessionState.value = "resume";
    // Keep ?session= in the URL so a refresh still resolves correctly
    if (!urlSessionId || urlSessionId !== existingId) {
      router.replace({ query: { session: existingId } });
    }
    return;
  }

  if (
    session.value?.status === "completed" ||
    session.value?.status === "abandoned"
  ) {
    // Only completed sessions exist — show the replay UI
    sessionState.value = "completed";
    return;
  }

  // No session at all — first time playing
  sessionState.value = "new";
});

// ── Begin (first attempt) ─────────────────────────────────────────────────────
async function handleStart() {
  if (sessionState.value === "resume" && resolvedSessionId.value) {
    // Already resolved — just navigate
    router.push(`/case/${caseId}/mentor?session=${resolvedSessionId.value}`);
    return;
  }

  // First attempt: create via the standard sessions/create endpoint
  starting.value = true;
  startError.value = null;
  try {
    const res = await $fetch<{ sessionId: string }>("/api/sessions/create", {
      method: "POST",
      body: { caseId: parseInt(caseId) },
    });
    if (res.sessionId) {
      useState("currentSessionId", () => res.sessionId).value = res.sessionId;
      router.push(`/case/${caseId}/mentor?session=${res.sessionId}`);
    } else {
      startError.value = sessionError.value || "Session creation failed.";
    }
  } catch (err: any) {
    startError.value =
      err?.data?.message || err?.message || "An unexpected error occurred.";
  } finally {
    starting.value = false;
  }
}

// ── Replay (new attempt after completion) ─────────────────────────────────────
async function handleReplay() {
  starting.value = true;
  startError.value = null;
  try {
    const newId = await startReplay(parseInt(caseId));
    if (newId) {
      router.push(`/case/${caseId}/mentor?session=${newId}`);
    } else {
      startError.value = sessionError.value || "Could not start a new attempt.";
    }
  } catch (err: any) {
    startError.value =
      err?.data?.message || err?.message || "An unexpected error occurred.";
  } finally {
    starting.value = false;
  }
}
</script>
