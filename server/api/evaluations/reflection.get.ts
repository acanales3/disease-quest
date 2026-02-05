import { serverSupabaseUser, serverSupabaseClient } from "#supabase/server";
import { createClient } from "@supabase/supabase-js";

type EvaluationRow = {
  id: number;
  student_id: string;
  case_id: number;
  reflection_document: string | null;
  history_taking_synthesis: number | null;
  physical_exam_interpretation: number | null;
  differential_diagnosis_formulation: number | null;
  diagnostic_tests: number | null;
  management_reasoning: number | null;
  communication_empathy: number | null;
  reflection_metacognition: number | null;
  created_at: string | null;
};

type UserProfileRow = {
  role: string;
  name?: string | null;
};

type UsersRow = {
  id: string;
  name?: string | null;
};

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const authedClient = await serverSupabaseClient(event);

  const userId: string | undefined = user?.id || user?.sub;

  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const query = getQuery(event);
  const caseId = Number(query.caseId);

  if (!caseId || Number.isNaN(caseId)) {
    throw createError({
      statusCode: 400,
      message: "Missing or invalid caseId",
    });
  }

  // Fetch user profile (role + name) using authed client (RLS applies)
  const { data: userProfile, error: profileError } = (await authedClient
    .from("users")
    .select("role,name")
    .eq("id", userId)
    .single()) as { data: UserProfileRow | null; error: any };

  if (profileError || !userProfile) {
    throw createError({
      statusCode: 403,
      message: "Forbidden: User profile not found",
    });
  }

  const role = (userProfile.role || "").toUpperCase();

  if (role !== "STUDENT") {
    throw createError({
      statusCode: 403,
      message: "Forbidden: Only students can access their reflection document",
    });
  }

  const selectEval = `
    id,
    student_id,
    case_id,
    reflection_document,
    history_taking_synthesis,
    physical_exam_interpretation,
    differential_diagnosis_formulation,
    diagnostic_tests,
    management_reasoning,
    communication_empathy,
    reflection_metacognition,
    created_at
  `;

  // SCRUM-186 1) Production behavior: get the evaluation for THIS user + case
  const strictRes = (await authedClient
    .from("evaluations")
    .select(selectEval)
    .eq("student_id", userId)
    .eq("case_id", caseId)
    .order("created_at", { ascending: false }) // supports multiple attempts later
    .limit(1)
    .maybeSingle()) as { data: EvaluationRow | null; error: any };

  if (strictRes.error) {
    throw createError({
      statusCode: 500,
      message: strictRes.error.message || "Failed to fetch evaluation",
    });
  }

  let evaluation: EvaluationRow | null = strictRes.data;
  let studentName = userProfile.name || "";

  // SCRUM-186 DEV fallback: if you only have 1 test row and it belongs to a different student,
  // authed client can't read it due to RLS. Use service role on the server to prove the flow.
  if (!evaluation) {
    const config = useRuntimeConfig();

    const supabaseUrl = config.public?.supabase?.url as string | undefined;
    const serviceKey = config.supabase?.serviceKey as string | undefined;

    const isDev = process.env.NODE_ENV !== "production";

    if (!isDev) {
      // In prod: do not leak other students' docs
      throw createError({
        statusCode: 404,
        message: "Reflection evaluation not found for this case",
      });
    }

    if (!supabaseUrl || !serviceKey) {
      // Tell you exactly what's missing
      throw createError({
        statusCode: 500,
        message:
          "DEV fallback requires runtimeConfig.supabase.serviceKey and public.supabase.url",
      });
    }

    const service = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const fallbackRes = (await service
      .from("evaluations")
      .select(selectEval)
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()) as { data: EvaluationRow | null; error: any };

    if (fallbackRes.error) {
      throw createError({
        statusCode: 500,
        message:
          fallbackRes.error.message ||
          "Failed to fetch evaluation (service fallback)",
      });
    }

    evaluation = fallbackRes.data;

    if (!evaluation) {
      throw createError({
        statusCode: 404,
        message: "Reflection evaluation not found for this case",
      });
    }

    // Try to fetch the REAL student name for the row (nice for the PDF header)
    const userRes = (await service
      .from("users")
      .select("id,name")
      .eq("id", evaluation.student_id)
      .maybeSingle()) as { data: UsersRow | null; error: any };

    if (!userRes.error && userRes.data?.name) {
      studentName = userRes.data.name;
    } else {
      studentName = studentName || "";
    }
  }

  // Case title (optional)
  const { data: caseRow } = await authedClient
    .from("cases")
    .select("id,title,name")
    .eq("id", caseId)
    .maybeSingle();

  const caseTitle =
    (caseRow as any)?.title || (caseRow as any)?.name || `Case ${caseId}`;

  return {
    id: evaluation.id,
    studentId: evaluation.student_id,
    caseId: evaluation.case_id,
    caseTitle,
    createdAt: evaluation.created_at,
    reflectionDocument: evaluation.reflection_document,

    scores: {
      historyTakingSynthesis: evaluation.history_taking_synthesis,
      physicalExamInterpretation: evaluation.physical_exam_interpretation,
      differentialDiagnosisFormulation:
        evaluation.differential_diagnosis_formulation,
      diagnosticTests: evaluation.diagnostic_tests,
      managementReasoning: evaluation.management_reasoning,
      communicationEmpathy: evaluation.communication_empathy,
      reflectionMetacognition: evaluation.reflection_metacognition,
    },

    student: {
      name: studentName,
    },
  };
});
