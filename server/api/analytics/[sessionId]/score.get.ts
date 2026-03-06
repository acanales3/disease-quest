import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);
  const userId = (user as any)?.id || (user as any)?.sub;

  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const sessionId = event.context.params?.sessionId;
  if (!sessionId) {
    throw createError({ statusCode: 400, message: "sessionId is required" });
  }

  // Fetch the evaluation row joined with session + case info
  const { data: evaluation, error } = await client
    .from("evaluations")
    .select(`
      history_taking_synthesis,
      physical_exam_interpretation,
      differential_diagnosis_formulation,
      diagnostic_tests,
      management_reasoning,
      communication_empathy,
      reflection_metacognition,
      case_id,
      session_id,
      cases(name),
      case_sessions(classroom_id, classrooms(name))
    `)
    .eq("session_id", sessionId)
    .single();

  if (error || !evaluation) {
    throw createError({
      statusCode: 404,
      message: "No evaluation found for this session",
    });
  }

  const caseName =
    Array.isArray(evaluation.cases)
      ? evaluation.cases[0]?.name
      : (evaluation.cases as any)?.name ?? "Unknown";

  const sessionData = Array.isArray(evaluation.case_sessions)
    ? evaluation.case_sessions[0]
    : evaluation.case_sessions;

  const classroomId = (sessionData as any)?.classroom_id ?? 0;
  const classroomName =
    (sessionData as any)?.classrooms?.name ?? "No Classroom";

  // Return in AnalyticsScoreEntry shape
  return {
    caseId: evaluation.case_id,
    caseName,
    classroomId,
    classroomName,
    count: 1,
    history_taking_synthesis: (evaluation.history_taking_synthesis ?? 0) * 100,
    physical_exam_interpretation: (evaluation.physical_exam_interpretation ?? 0) * 100,
    differential_diagnosis_formulation: (evaluation.differential_diagnosis_formulation ?? 0) * 100,
    diagnostic_tests: (evaluation.diagnostic_tests ?? 0) * 100,
    management_reasoning: (evaluation.management_reasoning ?? 0) * 100,
    communication_empathy: (evaluation.communication_empathy ?? 0) * 100,
    reflection_metacognition: (evaluation.reflection_metacognition ?? 0) * 100,
  };
});