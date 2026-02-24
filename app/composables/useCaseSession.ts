/**
 * Composable for managing an active case simulation session.
 *
 * Key design:
 * - Non-blocking: each agent call runs independently, no global lock
 * - Optimistic UI: user messages appear instantly before server responds
 * - Per-channel loading: patient and tutor have separate loading states
 * - Real-time timer: elapsed time ticks every second while session is active
 */
import { ref, computed } from "vue";

export interface SessionState {
  sessionId: string;
  caseId: number;
  caseName: string;
  status: string;
  phase: string;
  elapsedMinutes: number;
  unlockedDisclosures: string[];
  differentialHistory: Array<{
    timestamp_minutes: number;
    diagnoses: Array<{ diagnosis: string; likelihood: string; reasoning?: string }>;
  }>;
  finalDiagnosis: { diagnosis: string; reasoning: string } | null;
  managementPlan: string[];
  scoring: Record<string, unknown>;
  flags: Record<string, unknown>;
  vitals: {
    temp_f: number | null;
    hr_bpm: number | null;
    bp_systolic: number | null;
    bp_diastolic: number | null;
    rr_bpm: number | null;
    spo2_percent: number | null;
    cap_refill_sec: number | null;
  };
  patientStatus: {
    mentalStatus: string;
    hasShock: boolean;
    hasSeizure: boolean;
  };
  startedAt?: string;
}

export interface ChatMessage {
  id?: number;
  role: "student" | "patient" | "tutor" | "system" | "diagnostic" | "evaluator";
  content: string;
  created_at?: string;
  _optimistic?: boolean; // local-only, not yet confirmed by server
}

export function useCaseSession() {
  const session = ref<SessionState | null>(null);
  const patientMessages = ref<ChatMessage[]>([]);
  const tutorMessages = ref<ChatMessage[]>([]);
  const allMessages = ref<ChatMessage[]>([]);
  const error = ref<string | null>(null);

  // Per-agent loading states (non-blocking)
  const patientLoading = ref(false);
  const tutorLoading = ref(false);
  const actionLoading = ref(false); // for exam, orders, treatment, etc.

  // Combined loading for backward compat
  const loading = computed(() => patientLoading.value || tutorLoading.value || actionLoading.value);

  const isActive = computed(
    () => session.value?.status === "in_progress" || session.value?.status === "created"
  );
  const isCompleted = computed(() => session.value?.status === "completed");

  // ── Simulation timer ──
  // The display time is the server's elapsed_minutes (simulation time),
  // NOT real wall-clock time. It only advances when the server advances it
  // (via +5 min, ordering tests, etc.)
  const displayElapsed = computed(() => session.value?.elapsedMinutes ?? 0);

  // ── Session management ──

  async function createSession(caseId: number): Promise<string | null> {
    actionLoading.value = true;
    error.value = null;
    try {
      const res = await $fetch<{ sessionId: string }>("/api/sessions/create", {
        method: "POST",
        body: { caseId },
      });
      persistSessionId(caseId, res.sessionId);
      await loadSession(res.sessionId);
      return res.sessionId;
    } catch (err: unknown) {
      error.value = (err as Error).message ?? "Failed to create session";
      return null;
    } finally {
      actionLoading.value = false;
    }
  }

  /**
   * Resume or find the active session for a case.
   * Checks: useState > localStorage > API lookup.
   * Returns the session ID if found, null otherwise.
   */
  async function resumeSession(caseId: number): Promise<string | null> {
    // 1. Check useState
    const stateId = useState<string>("currentSessionId").value;
    if (stateId) {
      await loadSession(stateId);
      if (session.value) return stateId;
    }

    // 2. Check localStorage
    if (import.meta.client) {
      const stored = localStorage.getItem(`dq_session_${caseId}`);
      if (stored) {
        await loadSession(stored);
        if (session.value && session.value.status !== "completed" && session.value.status !== "abandoned") {
          useState<string>("currentSessionId", () => stored).value = stored;
          return stored;
        }
      }
    }

    // 3. Ask the server for the latest active session
    try {
      const res = await $fetch<{ sessionId: string | null }>(`/api/sessions/active?caseId=${caseId}`);
      if (res.sessionId) {
        persistSessionId(caseId, res.sessionId);
        await loadSession(res.sessionId);
        return res.sessionId;
      }
    } catch {
      // No active session found
    }

    return null;
  }

  function persistSessionId(caseId: number, sessionId: string) {
    useState<string>("currentSessionId", () => sessionId).value = sessionId;
    if (import.meta.client) {
      localStorage.setItem(`dq_session_${caseId}`, sessionId);
    }
  }

  async function loadSession(sessionId: string) {
    error.value = null;
    try {
      const data = await $fetch<SessionState>(`/api/sessions/${sessionId}`);
      session.value = data;
      await loadMessages(sessionId);
    } catch (err: unknown) {
      error.value = (err as Error).message ?? "Failed to load session";
    }
  }

  async function loadMessages(sessionId: string) {
    try {
      const data = await $fetch<ChatMessage[]>(`/api/sessions/${sessionId}/messages`);
      allMessages.value = data;
      // Split into patient and tutor channels
      patientMessages.value = data.filter(
        (m) =>
          m.role === "patient" ||
          m.role === "system" ||
          (m.role === "student" && !m.content.includes("[To Tutor]"))
      );
      tutorMessages.value = data
        .filter(
          (m) => m.role === "tutor" || (m.role === "student" && m.content.includes("[To Tutor]"))
        )
        .map((m) => ({ ...m, content: m.content.replace("[To Tutor] ", "") }));
    } catch {
      // Non-critical
    }
  }

  // ── Core action sender (non-blocking, fire-and-forget style) ──

  async function sendAction(
    actionType: string,
    payload: Record<string, unknown> = {}
  ): Promise<Record<string, unknown> | null> {
    if (!session.value?.sessionId) {
      error.value = "No active session";
      return null;
    }

    error.value = null;
    try {
      const result = await $fetch<Record<string, unknown>>(
        `/api/sessions/${session.value.sessionId}/action`,
        { method: "POST", body: { actionType, payload } }
      );

      // Lightweight state update from response
      if (result.current_time_minutes !== undefined && session.value) {
        session.value.elapsedMinutes = result.current_time_minutes as number;
      }
      if (result.phase && session.value) {
        session.value.phase = result.phase as string;
      }
      if (result.unlocked_disclosures && session.value) {
        session.value.unlockedDisclosures = result.unlocked_disclosures as string[];
      }

      return result;
    } catch (err: unknown) {
      error.value = (err as Error).message ?? "Action failed";
      return null;
    }
  }

  // ── Refresh session state (vitals, flags, etc.) without blocking ──
  async function refreshSession() {
    if (!session.value?.sessionId) return;
    try {
      const data = await $fetch<SessionState>(`/api/sessions/${session.value.sessionId}`);
      session.value = data;
    } catch {
      // Silent
    }
  }

  // ── Patient chat (non-blocking, optimistic) ──

  async function askPatient(question: string) {
    // Optimistic: show user message immediately
    patientMessages.value.push({ role: "student", content: question, _optimistic: true });
    patientLoading.value = true;

    try {
      const result = await sendAction("ask_patient", { content: question });

      // Add agent response
      if (result?.response) {
        patientMessages.value.push({
          role: "patient",
          content: result.response as string,
        });
      }

      // Refresh session state in background (for vitals update)
      refreshSession();

      return result;
    } finally {
      patientLoading.value = false;
    }
  }

  // ── Tutor chat (non-blocking, optimistic) ──

  async function consultTutor(question: string) {
    tutorMessages.value.push({ role: "student", content: question, _optimistic: true });
    tutorLoading.value = true;

    try {
      const result = await sendAction("consult_tutor", { content: question });

      if (result?.response) {
        tutorMessages.value.push({
          role: "tutor",
          content: result.response as string,
        });
      }

      return result;
    } finally {
      tutorLoading.value = false;
    }
  }

  // ── Other actions (use actionLoading, non-blocking) ──

  async function performExam(examType = "complete") {
    actionLoading.value = true;
    try {
      const r = await sendAction("perform_exam", { content: examType });
      refreshSession();
      return r;
    } finally {
      actionLoading.value = false;
    }
  }

  async function orderTest(testId: string, rationale?: string) {
    actionLoading.value = true;
    try {
      const r = await sendAction("order_test", { testId, rationale });
      refreshSession();
      return r;
    } finally {
      actionLoading.value = false;
    }
  }

  async function getResults(testId: string) {
    actionLoading.value = true;
    try {
      return await sendAction("get_results", { testId });
    } finally {
      actionLoading.value = false;
    }
  }

  async function administerTreatment(treatment: string, rationale?: string) {
    actionLoading.value = true;
    try {
      const r = await sendAction("administer_treatment", { treatment, rationale });
      refreshSession();
      return r;
    } finally {
      actionLoading.value = false;
    }
  }

  async function updateDifferential(
    differential: Array<{ diagnosis: string; likelihood: string; reasoning?: string }>
  ) {
    actionLoading.value = true;
    try {
      return await sendAction("update_differential", { differential });
    } finally {
      actionLoading.value = false;
    }
  }

  async function submitDiagnosis(diagnosis: string, reasoning: string) {
    actionLoading.value = true;
    try {
      return await sendAction("submit_diagnosis", { diagnosis, reasoning });
    } finally {
      actionLoading.value = false;
    }
  }

  async function advanceTime(minutes: number) {
    actionLoading.value = true;
    try {
      const r = await sendAction("advance_time", { minutes });
      refreshSession();
      return r;
    } finally {
      actionLoading.value = false;
    }
  }

  async function endCase() {
    actionLoading.value = true;
    try {
      return await sendAction("end_case", {});
    } finally {
      actionLoading.value = false;
    }
  }

  return {
    // State
    session,
    patientMessages,
    tutorMessages,
    allMessages,
    loading,
    patientLoading,
    tutorLoading,
    actionLoading,
    error,
    isActive,
    isCompleted,
    displayElapsed,
    // Methods
    createSession,
    resumeSession,
    loadSession,
    loadMessages,
    sendAction,
    refreshSession,
    // Chat
    askPatient,
    consultTutor,
    // Actions
    performExam,
    orderTest,
    getResults,
    administerTreatment,
    updateDifferential,
    submitDiagnosis,
    advanceTime,
    endCase,
  };
}
