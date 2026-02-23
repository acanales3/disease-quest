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

  const u = userData.data as any;
  const name =
    [u?.first_name, u?.last_name].filter(Boolean).join(" ") || "Admin";

  return {
    user: { name },
    counts: {
      students: studentsCount.count ?? 0,
      instructors: instructorsCount.count ?? 0,
      classrooms: classroomsCount.count ?? 0,
      cases: casesCount.count ?? 0,
    },
  };
});
