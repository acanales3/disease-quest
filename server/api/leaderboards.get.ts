import {
  serverSupabaseUser,
  serverSupabaseServiceRole,
} from "#supabase/server";
import type { Database } from "~/assets/types/supabase";
import type { LeaderboardEntry } from "~/assets/interface/Leaderboard";

export default defineEventHandler(
  async (event): Promise<LeaderboardEntry[]> => {
    const client = serverSupabaseServiceRole<Database>(event);
    const user = await serverSupabaseUser(event);

    if (!user)
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    // @ts-ignore
    const userId = user.id || user.sub;

    const { data: userData } = await client
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    const userRole = userData?.role;
    const isAdmin = userRole === "ADMIN";
    const isInstructor = userRole === "INSTRUCTOR";
    const isStudent = userRole === "STUDENT";

    const query = getQuery(event);
    const classroomId = query.classroomId
      ? Number(query.classroomId)
      : undefined;

    let allowedClassroomIds: number[] = [];

    if (isInstructor) {
      const { data: classrooms } = await client
        .from("classrooms")
        .select("id")
        .eq("instructor_id", userId);
      if (classrooms) allowedClassroomIds = classrooms.map((c) => c.id);
    } else if (isStudent) {
      const { data: classrooms } = await client
        .from("classroom_students")
        .select("classroom_id")
        .eq("student_id", userId);
      if (classrooms)
        allowedClassroomIds = classrooms.map((c) => c.classroom_id);
    }

    let dbQuery = client.from("leaderboard_view").select(`
      rank,
      cases_completed,
      average_score,
      student_id,
      leaderboard_id,
      students!inner(
        nickname,
        users(first_name, last_name)
      ),
      leaderboards!inner(
        classroom_id,
        classrooms(name)
      )
    `);

    if (!isAdmin) {
      if (allowedClassroomIds.length === 0) {
        console.log("[API] No allowed classrooms for non-admin user.");
        return [];
      }
      dbQuery = dbQuery.in("leaderboards.classroom_id", allowedClassroomIds);
    }

    if (classroomId && classroomId !== -1) {
      dbQuery = dbQuery.eq("leaderboards.classroom_id", classroomId);
    }

    dbQuery = dbQuery.order("rank", { ascending: true });

    const { data, error } = await dbQuery;

    if (error)
      throw createError({ statusCode: 500, statusMessage: error.message });
    if (!data || data.length === 0) return [];

    return data.map((row: any) => {
      let studentName = undefined;
      if (isAdmin && row.students?.users) {
        const u = row.students.users;
        studentName =
          [u.first_name, u.last_name].filter(Boolean).join(" ") || "Unknown";
      }

      return {
        id: row.leaderboard_id,
        studentId: row.student_id,
        classroomName: row.leaderboards?.classrooms?.name || "Unknown",
        nickname: row.students?.nickname || "Anonymous",
        casesCompleted: row.cases_completed || 0,
        averageScore: row.average_score || 0,
        rank: row.rank || 0,
        studentName,
      } as LeaderboardEntry;
    });
  },
);
