import {
  serverSupabaseUser,
  serverSupabaseServiceRole,
  serverSupabaseClient,
} from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);
  const serviceRole = serverSupabaseServiceRole(event);

  if (!user)
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

  // @ts-ignore
  const userId = user.id || user.sub;
  if (!userId)
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: User ID missing",
    });

  const { data: userProfile, error: profileError } = (await serviceRole
    .from("users")
    .select("role")
    .eq("id", userId)
    .single()) as { data: { role: string } | null; error: any };

  if (profileError || !userProfile || userProfile.role !== "ADMIN") {
    const msg = profileError
      ? `Error: ${profileError.message}`
      : `Role mismatch: ${userProfile?.role}`;
    console.error("Admin Stats 403:", msg);
    throw createError({
      statusCode: 403,
      statusMessage: `Forbidden: Admin access required. ${msg}`,
    });
  }

  const [
    userData,
    studentsCount,
    instructorsCount,
    classroomsCount,
    casesCount,
    latestStudent,
    latestInstructor,
    latestClassroom,
    latestCase,
  ] = await Promise.all([
    client
      .from("users")
      .select("first_name, last_name")
      .eq("id", userId)
      .single(),
    serviceRole.from("students").select("*", { count: "exact", head: true }),
    serviceRole.from("instructors").select("*", { count: "exact", head: true }),
    serviceRole.from("classrooms").select("*", { count: "exact", head: true }),
    serviceRole.from("cases").select("*", { count: "exact", head: true }),
    serviceRole
      .from("students")
      .select("users!inner(first_name, last_name, created_at)")
      .order("created_at", { foreignTable: "users", ascending: false })
      .limit(1)
      .maybeSingle(),
    serviceRole
      .from("instructors")
      .select("users!inner(first_name, last_name, created_at)")
      .order("created_at", { foreignTable: "users", ascending: false })
      .limit(1)
      .maybeSingle(),
    serviceRole
      .from("classrooms")
      .select("name, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    serviceRole
      .from("cases")
      .select("name, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (userData.error)
    console.error("Error fetching admin user name:", userData.error);
  if (studentsCount.error)
    console.error("Error counting students:", studentsCount.error);
  if (instructorsCount.error)
    console.error("Error counting instructors:", instructorsCount.error);
  if (classroomsCount.error)
    console.error("Error counting classrooms:", classroomsCount.error);
  if (casesCount.error)
    console.error("Error counting cases:", casesCount.error);
  if (latestStudent.error)
    console.error("Error fetching latest student:", latestStudent.error);
  if (latestInstructor.error)
    console.error("Error fetching latest instructor:", latestInstructor.error);
  if (latestClassroom.error)
    console.error("Error fetching latest classroom:", latestClassroom.error);
  if (latestCase.error)
    console.error("Error fetching latest case:", latestCase.error);

  const u = userData.data as any;
  const name =
    [u?.first_name, u?.last_name].filter(Boolean).join(" ") || "Admin";
  const latestStudentData = (latestStudent.data as any)?.users;
  const latestInstructorData = (latestInstructor.data as any)?.users;
  const latestClassroomData = latestClassroom.data as any;
  const latestCaseData = latestCase.data as any;

  const buildUserName = (person: any) =>
    [person?.first_name, person?.last_name].filter(Boolean).join(" ").trim() ||
    null;

  return {
    user: { name },
    counts: {
      students: studentsCount.count ?? 0,
      instructors: instructorsCount.count ?? 0,
      classrooms: classroomsCount.count ?? 0,
      cases: casesCount.count ?? 0,
    },
    latest: {
      students: latestStudentData
        ? {
            name: buildUserName(latestStudentData),
            createdAt: latestStudentData.created_at ?? null,
          }
        : null,
      instructors: latestInstructorData
        ? {
            name: buildUserName(latestInstructorData),
            createdAt: latestInstructorData.created_at ?? null,
          }
        : null,
      classrooms: latestClassroomData
        ? {
            name: latestClassroomData.name ?? null,
            createdAt: latestClassroomData.created_at ?? null,
          }
        : null,
      cases: latestCaseData
        ? {
            name: latestCaseData.name ?? null,
            createdAt: latestCaseData.created_at ?? null,
          }
        : null,
    },
  };
});
