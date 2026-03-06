/**
 * POST /api/sessions/create
 * Creates a new simulation session for a student.
 *
 * NOTE: Replay does NOT create a new session — it resets the existing one
 * via POST /api/sessions/replay. This endpoint is only for the very first
 * time a user attempts a case (or if no session exists yet).
 *
 * Body: { caseId: number }
 */
import { defineEventHandler, createError, readBody } from "h3";
import {
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from "#supabase/server";
import { generateUniqueNickname } from "../../utils/nickname-generator";

export default defineEventHandler(async (event) => {
  console.log("[session/create] === Session creation started ===");

  let user;
  try {
    user = await serverSupabaseUser(event);
  } catch (authErr: any) {
    console.error("[session/create] Auth error:", authErr?.message);
    throw createError({ statusCode: 401, message: "Authentication failed" });
  }

  // @ts-ignore
  const userId = user?.id || user?.sub;
  console.log("[session/create] userId:", userId, "email:", user?.email);

  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const client = serverSupabaseServiceRole(event);

  const body = await readBody(event);
  const caseId = body?.caseId;
  const classroomId = body?.classroomId;
  console.log("[session/create] caseId:", caseId, "classroomId:", classroomId);

  if (!caseId) {
    throw createError({ statusCode: 400, message: "caseId is required" });
  }

  // Guard: if a non-completed session already exists for this user+case+classroom,
  // return it instead of creating a duplicate. Each (user, case, classroom) has its own session.
  let existingQuery = client
    .from("case_sessions")
    .select("id, status, phase, attempt_number")
    .eq("user_id", userId)
    .eq("case_id", caseId)
    .in("status", ["created", "in_progress"]);
  if (classroomId != null) {
    existingQuery = existingQuery.eq("classroom_id", classroomId);
  } else {
    existingQuery = existingQuery.is("classroom_id", null);
  }
  const { data: existingSession } = await existingQuery
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingSession) {
    console.log(
      "[session/create] Active session already exists:",
      existingSession.id,
    );
    return {
      sessionId: existingSession.id,
      status: existingSession.status,
      phase: existingSession.phase,
    };
  }

  // Load the case
  console.log("[session/create] Loading case...");
  const { data: caseRow, error: caseErr } = await client
    .from("cases")
    .select("id, content")
    .eq("id", caseId)
    .single();

  if (caseErr || !caseRow) {
    console.error(
      "[session/create] Case lookup failed:",
      caseErr?.message,
      caseErr?.details,
    );
    throw createError({
      statusCode: 404,
      message: `Case not found: ${caseErr?.message ?? "no data"}`,
    });
  }
  console.log("[session/create] Case loaded, id:", (caseRow as any).id);

  const content = (caseRow as any).content as Record<string, unknown> | null;
  const initialPatientState = content?.initial_patient_state ?? {};

  // Dynamically find disclosures that unlock at START
  const disclosures = (content?.disclosures ?? []) as Array<{
    id: string;
    unlock?: { type: string };
  }>;
  const startDisclosures = disclosures
    .filter((d) => d.unlock?.type === "START")
    .map((d) => d.id);
  console.log("[session/create] Start disclosures:", startDisclosures);

  // Determine attempt_number: count prior sessions for this user+case+classroom
  let countQuery = client
    .from("case_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("case_id", caseId);
  if (classroomId != null) {
    countQuery = countQuery.eq("classroom_id", classroomId);
  } else {
    countQuery = countQuery.is("classroom_id", null);
  }
  const { count: priorCount } = await countQuery;

  const attemptNumber = (priorCount ?? 0) + 1;
  console.log("[session/create] attempt_number:", attemptNumber);

  // Ensure the student exists in the students table (FK requirement)
  console.log("[session/create] Checking student record...");
  const { data: existingStudent, error: studentCheckErr } = await client
    .from("students")
    .select("user_id")
    .eq("user_id", userId)
    .single();

  if (studentCheckErr) {
    console.log(
      "[session/create] Student check result:",
      studentCheckErr.code,
      studentCheckErr.message,
    );
  }

  if (!existingStudent) {
    console.log("[session/create] Student not found, creating...");
    const { error: studentErr } = await client.from("students").insert({
      user_id: userId,
      nickname: await generateUniqueNickname(client),
    } as any);
    if (studentErr) {
      console.error(
        "[session/create] Student creation failed:",
        studentErr.message,
        studentErr.details,
        studentErr.hint,
        studentErr.code,
      );
      throw createError({
        statusCode: 500,
        message: `Cannot create session: student record creation failed - ${studentErr.message}`,
      });
    }
    console.log("[session/create] Student record created");
  } else {
    console.log("[session/create] Student already exists");
  }

  // Create the session
  console.log("[session/create] Inserting session...");
  const { data: session, error: sessionErr } = await client
    .from("case_sessions")
    .insert({
      user_id: userId,
      case_id: caseId,
      classroom_id: classroomId || null,
      status: "created",
      phase: "prologue",
      elapsed_minutes: 0,
      unlocked_disclosures: startDisclosures,
      patient_state: initialPatientState,
      differential_history: [],
      management_plan: [],
      scoring: {},
      attempt_number: attemptNumber,
      flags: {
        correct_diagnosis_suspected: false,
        antibiotics_ordered: false,
        antibiotics_started: false,
        cultures_before_antibiotics: false,
        shock_addressed: false,
        seizure_addressed: false,
        airway_addressed: false,
        _triggered_actions: [],
        _triggered_events: [],
      },
    } as any)
    .select()
    .single();

  if (sessionErr || !session) {
    console.error(
      "[session/create] Session insert failed:",
      sessionErr?.message,
      sessionErr?.details,
      sessionErr?.hint,
      sessionErr?.code,
    );
    throw createError({
      statusCode: 500,
      message: `Failed to create session: ${sessionErr?.message ?? "unknown error"}`,
    });
  }

  console.log("[session/create] Session created:", (session as any).id);
  console.log("[session/create] === Session creation complete ===");

  return {
    sessionId: (session as any).id,
    status: (session as any).status,
    phase: (session as any).phase,
  };
});
