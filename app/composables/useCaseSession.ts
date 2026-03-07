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
    hasRespiratoryFailure?: boolean;
  };
  patientSex?: string | null;
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

  async function createSession(caseId: number, classroomId?: number): Promise<string | null> {
    actionLoading.value = true;
    error.value = null;
    try {
      const res = await $fetch<{ sessionId: string }>("/api/sessions/create", {
        method: "POST",
        body: { caseId, classroomId },
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

  function sanitizeSystemMessage(content: string): string {
    // Convert raw internal strings from old sessions to readable clinical observations
    const c = content.trim();

    // Already emoji-formatted (new format) — pass through
    if (/^[📋💊🕐🩺🔬⏳📝🚨📊⚠️]/.test(c)) return c;

    // Old "Time advanced by X minutes. Current time: Y min." → tidy
    const timeMatch = c.match(/Time advanced by (\d+) minutes?\. Current time: (\d+) min/i);
    if (timeMatch) return `🕐 ${timeMatch[1]} min elapsed. Sim time: T+${timeMatch[2]} min.`;

    // Old "Results pending. Expected in X minute(s)." → tidy
    const pendingMatch = c.match(/Results? pending\.? Expected in (\d+)/i);
    if (pendingMatch) return `⏳ Results pending (~${pendingMatch[1]} min remaining).`;

    // Old "X has been administered. BP now Y/Z." → tidy
    const treatMatch = c.match(/^(.+?) has been administered\.\s*(.*)/i);
    if (treatMatch) return `💊 ${treatMatch[1]} administered. ${treatMatch[2]}`.trim();

    // Old "ALERT: ..." with diagnosis leaks
    if (c.startsWith("ALERT:")) {
      const body = c.replace(/^ALERT:\s*/i, "")
        .replace(/lack of .+? (allows|causes|leads)/gi, "Progression —")
        .replace(/without .+?[,;]/gi, "")
        .replace(/antibiot\w+\s*(therapy|treatment)?/gi, "antimicrobial therapy")
        .replace(/\b(meningitis|sepsis|encephalitis|meningococcal|pneumococcal)\b/gi, "the underlying condition")
        .trim();
      return `🚨 ${body}`;
    }

    // Old "Trajectory: ..." with leaks
    if (c.startsWith("Trajectory:")) {
      const body = c.replace(/^Trajectory:\s*/i, "")
        .replace(/antibiot\w+\s*(therapy|treatment)?/gi, "antimicrobial therapy")
        .replace(/\b(meningitis|sepsis|encephalitis|meningococcal|pneumococcal)\b/gi, "the underlying condition")
        .replace(/without.+?intervention/gi, "without intervention")
        .trim();
      return `📊 ${body}`;
    }

    // Old "Clinical note: ..."
    if (c.startsWith("Clinical note:")) {
      return `📝 ${c.replace(/^Clinical note:\s*/i, "").trim()}`;
    }

    return c;
  }

  async function loadMessages(sessionId: string) {
    try {
      const data = await $fetch<ChatMessage[]>(`/api/sessions/${sessionId}/messages`);
      allMessages.value = data;

      // Apply sanitization to system messages so old raw DB strings look clean
      const normalized = data.map((m): ChatMessage =>
        m.role === "system" ? { ...m, content: sanitizeSystemMessage(m.content) } : m
      );

      // Split into patient and tutor channels
      patientMessages.value = normalized.filter(
        (m) =>
          m.role === "patient" ||
          m.role === "system" ||
          (m.role === "student" && !m.content.includes("[To Tutor]"))
      );
      tutorMessages.value = normalized
        .filter(
          (m) => m.role === "tutor" || (m.role === "student" && m.content.includes("[To Tutor]"))
        )
        .map((m) => ({ ...m, content: m.content.replace("[To Tutor] ", "") }));
    } catch {
      // Non-critical
    }
  }

  function appendSystemFeed(content: string) {
    const text = sanitizeSystemMessage(content.trim());
    if (!text) return;
    const last = patientMessages.value[patientMessages.value.length - 1];
    if (last?.role === "system" && last.content === text) return;

    const msg: ChatMessage = { role: "system", content: text };
    patientMessages.value.push(msg);
    allMessages.value.push(msg);
  }

  function appendActionFeedback(
    actionType: string,
    result: Record<string, unknown>,
  ) {
    // ask_patient / consult_tutor messages go into their respective chat channels, not feed
    if (actionType === "ask_patient" || actionType === "consult_tutor") return;

    // The server now produces pre-formatted clinical feed entries.
    // We display the server-composed notices only — never raw internal strings like
    // "Time advanced by X minutes" or AI trajectory text that leaks the diagnosis.

    // The orchestrator writes system messages directly to the DB now.
    // On the client, we only surface the notices/deterioration for immediate display
    // (before the next loadMessages call). These are already sanitised server-side.

    const feed: string[] = [];

    // Server-side notices are already formatted with emoji prefixes
    if (Array.isArray(result.notices)) {
      for (const n of result.notices) {
        if (typeof n === "string" && n.trim()) feed.push(n);
      }
    }

    // Deterioration events from server (already emoji-prefixed by orchestrator)
    if (Array.isArray(result.deterioration_events)) {
      for (const d of result.deterioration_events) {
        if (typeof d === "string" && d.trim()) {
          // Strip diagnosis-leaking language client-side as a safety net
          const sanitized = (d as string)
            .replace(/lack of .+? (allows|causes|leads)/gi, "Progression —")
            .replace(/without .+?[,;]/gi, "")
            .replace(/antibiot\w+\s*(therapy|treatment)?/gi, "antimicrobial therapy")
            .replace(/\b(meningitis|sepsis|encephalitis|meningococcal|pneumococcal)\b/gi, "the underlying condition")
            .trim();
          feed.push(`🚨 ${sanitized || d}`);
        }
      }
    }

    const uniqueFeed = [...new Set(feed.map((f) => f.trim()).filter(Boolean))];
    for (const item of uniqueFeed) appendSystemFeed(item);
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

      // Lightweight state update from response — never let server rewind the clock
      if (result.current_time_minutes !== undefined && session.value) {
        const serverMinutes = result.current_time_minutes as number;
        // Only update if server is ahead of local (e.g. server applied a penalty or advance)
        if (serverMinutes > session.value.elapsedMinutes) {
          session.value.elapsedMinutes = serverMinutes;
        }
      }
      if (result.phase && session.value) {
        session.value.phase = result.phase as string;
      }
      if (result.unlocked_disclosures && session.value) {
        session.value.unlockedDisclosures = result.unlocked_disclosures as string[];
      }

      appendActionFeedback(actionType, result);

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
      // Preserve the locally-ticking elapsedMinutes — never let a server snapshot rewind the clock.
      // Only advance it if the server is genuinely ahead.
      const localElapsed = session.value.elapsedMinutes;
      session.value = data;
      if (localElapsed > (data.elapsedMinutes ?? 0)) {
        session.value.elapsedMinutes = localElapsed;
      }
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
      // Pass current client elapsed time so server uses the real sim clock,
      // not just the last DB-synced value (which may lag by up to 60 seconds).
      return await sendAction("get_results", {
        testId,
        clientElapsedMinutes: Math.floor(session.value?.elapsedMinutes ?? 0),
      });
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
      const r = await sendAction("advance_time", {
        minutes,
        clientElapsedMinutes: Math.floor(session.value?.elapsedMinutes ?? 0),
      });
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
