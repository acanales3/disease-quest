import {
  serverSupabaseClient,
  serverSupabaseServiceRole,
} from "#supabase/server";
import type { Database } from "@/assets/types/supabase";
import { generateUniqueNickname } from "../../utils/nickname-generator";

type DashboardCase = {
  id: number;
  name: string;
  description: string;
  classroom: string;
  completionDate: string;
  status: "not started" | "in progress" | "completed";
};

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

  const studentId = user.id;

  const { data: userRow } = await supabase
    .from("users")
    .select("first_name, last_name")
    .eq("id", studentId)
    .single();

  const { data: studentStats } = await supabase
    .from("students")
    .select("login_streak, last_login_date, nickname")
    .eq("user_id", studentId)
    .single();

  let nickname = studentStats?.nickname ?? null;

  if (studentStats && !studentStats.nickname) {
    const serviceClient = await serverSupabaseServiceRole<Database>(event);
    const generatedNickname = await generateUniqueNickname(serviceClient);
    await serviceClient
      .from("students")
      .update({ nickname: generatedNickname })
      .eq("user_id", studentId);
    nickname = generatedNickname;
  }

  let streak = studentStats?.login_streak ?? 0;
  let lastLogin = studentStats?.last_login_date
    ? new Date(studentStats.last_login_date)
    : null;
  const now = new Date();

  const msPerDay = 1000 * 60 * 60 * 24;
  const nowUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  let needsUpdate = false;

  if (!lastLogin) {
    if (streak === 0) streak = 1;
    needsUpdate = true;
  } else {
    const lastLoginUTC = Date.UTC(
      lastLogin.getUTCFullYear(),
      lastLogin.getUTCMonth(),
      lastLogin.getUTCDate(),
    );
    const diffDays = Math.floor((nowUTC - lastLoginUTC) / msPerDay);

    if (diffDays === 1) {
      streak += 1;
      needsUpdate = true;
    } else if (diffDays > 1) {
      streak = 1;
      needsUpdate = true;
    }
  }

  if (needsUpdate) {
    const serviceClient = await serverSupabaseServiceRole<Database>(event);
    const { error: updateError } = await serviceClient
      .from("students")
      .update({
        login_streak: streak,
        last_login_date: now.toISOString(),
      })
      .eq("user_id", studentId);

    if (updateError) {
      console.error("Failed to update student streak:", updateError);
    }
  }

  const { data: classrooms } = await supabase
    .from("classroom_students")
    .select("classroom_id")
    .eq("student_id", studentId);

  if (!classrooms || classrooms.length === 0) {
    return {
      user: {
        first_name: userRow?.first_name ?? null,
        last_name: userRow?.last_name ?? null,
        nickname,
      },
      stats: {
        login_streak: streak,
        total: 0,
        completedPercent: 0,
        inProgress: 0,
        notStartedPercent: 0,
      },
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

  if (classroomError)
    throw createError({
      statusCode: 500,
      statusMessage: classroomError.message,
    });

  const { data: studentCases, error } = await supabase
    .from("case_sessions")
    .select("case_id, started_at, completed_at, status")
    .eq("user_id", studentId);

  if (error)
    throw createError({ statusCode: 500, statusMessage: error.message });

  const progressMap = new Map(
    (studentCases ?? []).map((sc) => [sc.case_id, sc]),
  );

  const cases: DashboardCase[] = classroomCases
    .filter((row) => row.cases)
    .map((row) => {
      const c = row.cases!;
      const progress = progressMap.get(c.id);
      let status: DashboardCase["status"] = "not started";
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
      nickname,
    },
    stats: {
      total,
      completed,
      completedPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
      inProgress,
      notStartedPercent:
        total === 0 ? 0 : Math.round((notStarted / total) * 100),
      login_streak: streak,
    },
    cases,
  };
});
