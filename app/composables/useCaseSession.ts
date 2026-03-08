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
      persistSessionId(caseId, res.sessionId, classroomId);
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
   * classroomId must be passed for students so we scope the lookup to the
   * correct classroom. Admins/instructors omit it.
   *
   * Checks: useState > localStorage (scoped by classroom) > API lookup.
   */
  async function resumeSession(caseId: number, classroomId?: number): Promise<string | null> {
    // When classroomId is present, wipe any stale session state immediately
    // so the UI never flashes content from a different classroom while the
    // correct session is being fetched.
    if (classroomId) {
      session.value = null;
      patientMessages.value = [];
      tutorMessages.value = [];
      allMessages.value = [];
      useState<string>("currentSessionId").value = "";
    }

    // 1. For admin/instructor (no classroomId), trust useState as before.
    //    For students, skip straight to the classroom-scoped lookup below.
    const stateId = useState<string>("currentSessionId").value;
    if (stateId && !classroomId) {
      await loadSession(stateId);
      if (session.value) {
        return stateId;
      }
    }

    // 2. Check localStorage — key is scoped to (caseId, classroomId) so the
    //    same case in two classrooms never collides.
    if (import.meta.client) {
      const storageKey = classroomId
        ? `dq_session_${caseId}_cls_${classroomId}`
        : `dq_session_${caseId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        await loadSession(stored);
        if (
          session.value &&
          session.value.status !== "completed" &&
          session.value.status !== "abandoned"
        ) {
          useState<string>("currentSessionId", () => stored).value = stored;
          return stored;
        }
      }
    }

    // 3. Ask the server for the latest active session scoped to this classroom.
    try {
      const params = new URLSearchParams({ caseId: String(caseId) });
      if (classroomId) params.set("classroomId", String(classroomId));

      const res = await $fetch<{ sessionId: string | null }>(
        `/api/sessions/active?${params.toString()}`
      );
      if (res.sessionId) {
        persistSessionId(caseId, res.sessionId, classroomId);
        await loadSession(res.sessionId);
        return res.sessionId;
      }
    } catch {
      // No active session found
    }

    return null;
  }

  // Storage key is scoped to (caseId, classroomId) so the same case in two
  // classrooms never overwrites each other in localStorage.
  function persistSessionId(caseId: number, sessionId: string, classroomId?: number) {
    useState<string>("currentSessionId", () => sessionId).value = sessionId;
    if (import.meta.client) {
      const storageKey = classroomId
        ? `dq_session_${caseId}_cls_${classroomId}`
        : `dq_session_${caseId}`;
      localStorage.setItem(storageKey, sessionId);
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
    const c = content.trim();
    if (/^[📋💊🕐🩺🔬⏳📝🚨📊⚠️]/.test(c)) return c;
    const timeMatch = c.match(/Time advanced by (\d+) minutes?\. Current time: (\d+) min/i);
    if (timeMatch) return `🕐 ${timeMatch[1]} min elapsed. Sim time: T+${timeMatch[2]} min.`;
    const pendingMatch = c.match(/Results? pending\.? Expected in (\d+)/i);
    if (pendingMatch) return `⏳ Results pending (~${pendingMatch[1]} min remaining).`;
    const treatMatch = c.match(/^(.+?) has been administered\.\s*(.*)/i);
    if (treatMatch) return `💊 ${treatMatch[1]} administered. ${treatMatch[2]}`.trim();
    if (c.startsWith("ALERT:")) {
      const body = c.replace(/^ALERT:\s*/i, "")
        .replace(/lack of .+? (allows|causes|leads)/gi, "Progression —")
        .replace(/without .+?[,;]/gi, "")
        .replace(/antibiot\w+\s*(therapy|treatment)?/gi, "antimicrobial therapy")
        .replace(/\b(meningitis|sepsis|encephalitis|meningococcal|pneumococcal)\b/gi, "the underlying condition")
        .trim();
      return `🚨 ${body}`;
    }
    if (c.startsWith("Trajectory:")) {
      const body = c.replace(/^Trajectory:\s*/i, "")
        .replace(/antibiot\w+\s*(therapy|treatment)?/gi, "antimicrobial therapy")
        .replace(/\b(meningitis|sepsis|encephalitis|meningococcal|pneumococcal)\b/gi, "the underlying condition")
        .replace(/without.+?intervention/gi, "without intervention")
        .trim();
      return `📊 ${body}`;
    }
    if (c.startsWith("Clinical note:")) {
      return `📝 ${c.replace(/^Clinical note:\s*/i, "").trim()}`;
    }
    return c;
  }

  async function loadMessages(sessionId: string) {
    try {
      const data = await $fetch<ChatMessage[]>(`/api/sessions/${sessionId}/messages`);
      allMessages.value = data;
      const normalized = data.map((m): ChatMessage =>
        m.role === "system" ? { ...m, content: sanitizeSystemMessage(m.content) } : m
      );
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

  function appendActionFeedback(actionType: string, result: Record<string, unknown>) {
    if (actionType === "ask_patient" || actionType === "consult_tutor") return;
    const feed: string[] = [];
    if (Array.isArray(result.notices)) {
      for (const n of result.notices) {
        if (typeof n === "string" && n.trim()) feed.push(n);
      }
    }
    if (Array.isArray(result.deterioration_events)) {
      for (const d of result.deterioration_events) {
        if (typeof d === "string" && d.trim()) {
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
      if (result.current_time_minutes !== undefined && session.value) {
        const serverMinutes = result.current_time_minutes as number;
        if (serverMinutes > session.value.elapsedMinutes) {
          session.value.elapsedMinutes = serverMinutes;
        }
      }
      if (result.phase && session.value) session.value.phase = result.phase as string;
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

  async function refreshSession() {
    if (!session.value?.sessionId) return;
    try {
      const data = await $fetch<SessionState>(`/api/sessions/${session.value.sessionId}`);
      const localElapsed = session.value.elapsedMinutes;
      session.value = data;
      if (localElapsed > (data.elapsedMinutes ?? 0)) {
        session.value.elapsedMinutes = localElapsed;
      }
    } catch {
      // Silent
    }
  }

  async function askPatient(question: string) {
    patientMessages.value.push({ role: "student", content: question, _optimistic: true });
    patientLoading.value = true;
    try {
      const result = await sendAction("ask_patient", { content: question });
      if (result?.response) {
        patientMessages.value.push({ role: "patient", content: result.response as string });
      }
      refreshSession();
      return result;
    } finally {
      patientLoading.value = false;
    }
  }

  async function consultTutor(question: string) {
    tutorMessages.value.push({ role: "student", content: question, _optimistic: true });
    tutorLoading.value = true;
    try {
      const result = await sendAction("consult_tutor", { content: question });
      if (result?.response) {
        tutorMessages.value.push({ role: "tutor", content: result.response as string });
      }
      return result;
    } finally {
      tutorLoading.value = false;
    }
  }

  async function performExam(examType = "complete") {
    actionLoading.value = true;
    try { const r = await sendAction("perform_exam", { content: examType }); refreshSession(); return r; }
    finally { actionLoading.value = false; }
  }

  async function orderTest(testId: string, rationale?: string) {
    actionLoading.value = true;
    try { const r = await sendAction("order_test", { testId, rationale }); refreshSession(); return r; }
    finally { actionLoading.value = false; }
  }

  async function getResults(testId: string) {
    actionLoading.value = true;
    try {
      return await sendAction("get_results", {
        testId,
        clientElapsedMinutes: Math.floor(session.value?.elapsedMinutes ?? 0),
      });
    } finally { actionLoading.value = false; }
  }

  async function administerTreatment(treatment: string, rationale?: string) {
    actionLoading.value = true;
    try { const r = await sendAction("administer_treatment", { treatment, rationale }); refreshSession(); return r; }
    finally { actionLoading.value = false; }
  }

  async function updateDifferential(
    differential: Array<{ diagnosis: string; likelihood: string; reasoning?: string }>
  ) {
    actionLoading.value = true;
    try { return await sendAction("update_differential", { differential }); }
    finally { actionLoading.value = false; }
  }

  async function submitDiagnosis(diagnosis: string, reasoning: string) {
    actionLoading.value = true;
    try { return await sendAction("submit_diagnosis", { diagnosis, reasoning }); }
    finally { actionLoading.value = false; }
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
    } finally { actionLoading.value = false; }
  }

  async function endCase() {
    actionLoading.value = true;
    try { return await sendAction("end_case", {}); }
    finally { actionLoading.value = false; }
  }

  return {
    session, patientMessages, tutorMessages, allMessages,
    loading, patientLoading, tutorLoading, actionLoading,
    error, isActive, isCompleted, displayElapsed,
    createSession, resumeSession, loadSession, loadMessages,
    sendAction, refreshSession,
    askPatient, consultTutor,
    performExam, orderTest, getResults, administerTreatment,
    updateDifferential, submitDiagnosis, advanceTime, endCase,
  };
}