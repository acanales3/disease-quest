import {
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from "#supabase/server";
import type { Database } from "~/assets/types/supabase";

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole<Database>(event);
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  // @ts-ignore
  const userId = user.id || user.sub;

  // 1. Get User Role
  const { data: userData, error: userError } = await client
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (userError || !userData) {
    throw createError({
      statusCode: 403,
      statusMessage: "User role not found",
    });
  }

  const role = userData.role;

  // 2. Determine Scope (Allowed Classrooms)
  let allowedClassroomIds: number[] = [];

  if (role === "INSTRUCTOR") {
    const { data: classrooms } = await client
      .from("classrooms")
      .select("id")
      .eq("instructor_id", userId);

    if (classrooms) {
      allowedClassroomIds = classrooms.map((c) => c.id);
    }
  } else if (role === "STUDENT") {
    const { data: enrollments } = await client
      .from("classroom_students")
      .select("classroom_id")
      .eq("student_id", userId);

    if (enrollments) {
      allowedClassroomIds = enrollments.map((e) => e.classroom_id);
    }
  }

  // 3. Build Query
  let dbQuery = client.from("evaluations").select(`
            history_taking_synthesis,
            physical_exam_interpretation,
            differential_diagnosis_formulation,
            diagnostic_tests,
            management_reasoning,
            communication_empathy,
            reflection_metacognition,
            cases!inner (
                id,
                name,
                classroom_cases!inner (
                    classroom_id,
                    classrooms!inner (
                        id,
                        name
                    )
                )
            )
        `);

  // Apply Role Filters
  if (role === "STUDENT") {
    // ← was: .eq('student_id', userId) — column is now user_id
    dbQuery = dbQuery.eq("user_id", userId);
    if (allowedClassroomIds.length > 0) {
      dbQuery = dbQuery.in(
        "cases.classroom_cases.classroom_id",
        allowedClassroomIds,
      );
    } else {
      return [];
    }
  } else if (role === "INSTRUCTOR") {
    if (allowedClassroomIds.length > 0) {
      dbQuery = dbQuery.in(
        "cases.classroom_cases.classroom_id",
        allowedClassroomIds,
      );
    } else {
      return [];
    }
  } else if (role !== "ADMIN") {
    return [];
  }

  const { data, error } = await dbQuery;

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  // 4. Aggregate in memory
  const aggregationMap = new Map<
    string,
    {
      caseId: number;
      caseName: string;
      classroomId: number;
      classroomName: string;
      count: number;
      scores: {
        history_taking_synthesis: number[];
        physical_exam_interpretation: number[];
        differential_diagnosis_formulation: number[];
        diagnostic_tests: number[];
        management_reasoning: number[];
        communication_empathy: number[];
        reflection_metacognition: number[];
      };
    }
  >();

  data.forEach((row: any) => {
    const caseData = row.cases;
    if (!caseData || !caseData.classroom_cases) return;

    caseData.classroom_cases.forEach((cc: any) => {
      const cls = cc.classrooms;
      if (!cls) return;

      if (role !== "ADMIN" && !allowedClassroomIds.includes(cls.id)) return;

      const key = `${caseData.id}-${cls.id}`;

      if (!aggregationMap.has(key)) {
        aggregationMap.set(key, {
          caseId: caseData.id,
          caseName: caseData.name,
          classroomId: cls.id,
          classroomName: cls.name,
          count: 0,
          scores: {
            history_taking_synthesis: [],
            physical_exam_interpretation: [],
            differential_diagnosis_formulation: [],
            diagnostic_tests: [],
            management_reasoning: [],
            communication_empathy: [],
            reflection_metacognition: [],
          },
        });
      }

      const entry = aggregationMap.get(key)!;
      entry.count++;

      const pushScore = (field: string) => {
        if (typeof row[field] === "number") {
          // @ts-ignore
          entry.scores[field].push(row[field]);
        }
      };

      pushScore("history_taking_synthesis");
      pushScore("physical_exam_interpretation");
      pushScore("differential_diagnosis_formulation");
      pushScore("diagnostic_tests");
      pushScore("management_reasoning");
      pushScore("communication_empathy");
      pushScore("reflection_metacognition");
    });
  });

  // 5. Compute averages (scores are stored as 0.0–1.0, multiply by 100 for %)
  const results = Array.from(aggregationMap.values()).map((entry) => {
    const avg = (nums: number[]) =>
      nums.length
        ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100)
        : 0;

    return {
      caseId: entry.caseId,
      caseName: entry.caseName,
      classroomId: entry.classroomId,
      classroomName: entry.classroomName,
      count: entry.count,
      history_taking_synthesis: avg(entry.scores.history_taking_synthesis),
      physical_exam_interpretation: avg(
        entry.scores.physical_exam_interpretation,
      ),
      differential_diagnosis_formulation: avg(
        entry.scores.differential_diagnosis_formulation,
      ),
      diagnostic_tests: avg(entry.scores.diagnostic_tests),
      management_reasoning: avg(entry.scores.management_reasoning),
      communication_empathy: avg(entry.scores.communication_empathy),
      reflection_metacognition: avg(entry.scores.reflection_metacognition),
    };
  });

  return results.sort((a, b) => {
    if (a.classroomName !== b.classroomName)
      return a.classroomName.localeCompare(b.classroomName);
    return a.caseName.localeCompare(b.caseName);
  });
});
