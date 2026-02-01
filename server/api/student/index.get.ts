import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  
  const supabase = (await serverSupabaseClient(event)) as any;

  const { data, error } = await supabase
    .from("students")
    .select(
      `
      user_id,
      nickname,
      msyear,
      status,
      users (
        first_name,
        last_name,
        email,
        school
      ),
      classroom_students (
        classroom_id
      )
    `
    )
    .order("user_id", { ascending: true });

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch students",
      data: { details: error?.message ?? error },
    });
  }

  const students = (data ?? []).map((row: any, idx: number) => {
    const first = row?.users?.first_name ?? "";
    const last = row?.users?.last_name ?? "";
    const name = `${first} ${last}`.trim() || row?.users?.name || row?.nickname || "Unknown";

    const classroomId =
      Array.isArray(row?.classroom_students) && row.classroom_students.length > 0
        ? row.classroom_students[0]?.classroom_id ?? 0
        : 0;

    return {
      // Keep numeric id for the UI datatable (row number)
      id: idx + 1,
      // Keep UUID for backend operations (delete)
      userId: row.user_id,
      name,
      email: row?.users?.email ?? "",
      school: row?.users?.school ?? "",
      msyear: row?.msyear ?? 0,
      classroom: Number(classroomId) || 0,
      status: row?.status ?? "registered",
    };
  });

  return students;
});

