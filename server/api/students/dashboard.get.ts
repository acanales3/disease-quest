import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "@/assets/types/supabase";
import type { Case } from "@/components/CaseDatatable/columns";

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const studentId = user.id;

  // User name — select first_name and last_name instead of name
  const { data: userRow } = await supabase
    .from("users")
    .select("first_name, last_name")
    .eq("id", studentId)
    .single();

  // Classrooms
  const { data: classrooms } = await supabase
    .from("classroom_students")
    .select("classroom_id")
    .eq("student_id", studentId);

  if (!classrooms || classrooms.length === 0) {
    return {
      user: {
        first_name: userRow?.first_name ?? null,
        last_name: userRow?.last_name ?? null,
      },
      stats: null,
      cases: [],
    };
  }

  const classroomIds = classrooms.map((c) => c.classroom_id);

  const { data: classroomCases, error: classroomError } = await supabase
    .from("classroom_cases")
    .select(
      `
      classroom_id,
      cases:case_id (
        id,
        name,
        description
      ),
      classrooms:classroom_id (
        code
      )
    `,
    )
    .in("classroom_id", classroomIds);

  if (classroomError) {
    throw createError({
      statusCode: 500,
      statusMessage: classroomError.message,
    });
  }

  const { data: studentCases, error } = await supabase
    .from("student_cases")
    .select("case_id, started_at, completed_at")
    .eq("student_id", studentId);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  const progressMap = new Map(
    (studentCases ?? []).map((sc) => [sc.case_id, sc]),
  );

  const cases: Case[] = classroomCases
    .filter((row) => row.cases)
    .map((row) => {
      const c = row.cases!;
      const progress = progressMap.get(c.id);

      let status: Case["status"] = "not started";
      let completionDate: string | null = null;

      if (progress) {
        if (progress.completed_at) {
          status = "completed";
          completionDate = progress.completed_at;
        } else if (progress.started_at) {
          status = "in progress";
        }
      }

      return {
        id: c.id,
        name: c.name,
        description: c.description ?? "",
        classroom: row.classrooms?.code ?? "",
        completionDate: completionDate ?? "-",
        status,
      };
    });

  const total = cases.length;
  const completed = cases.filter((c) => c.status === "completed").length;
  const inProgress = cases.filter((c) => c.status === "in progress").length;
  const notStarted = cases.filter((c) => c.status === "not started").length;

  return {
    user: {
      first_name: userRow?.first_name ?? null,
      last_name: userRow?.last_name ?? null,
    },
    stats: {
      total,
      completedPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
      inProgress,
      notStartedPercent:
        total === 0 ? 0 : Math.round((notStarted / total) * 100),
    },
    cases,
  };
});
