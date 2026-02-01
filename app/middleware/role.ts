export default defineNuxtRouteMiddleware(async (to, from) => {
  const { getUserProfile } = useUsers();
  const supabase = useSupabaseClient();

  // Get the required role from page meta
  const requiredRole = to.meta.role as string | undefined;

  // If no role is specified in meta, allow access
  if (!requiredRole) {
    return;
  }

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Ensure we have an authenticated user
  if (!session?.user) {
    console.log("No user in role middleware");
    return navigateTo("/login");
  }

  // Fetch user profile to get their role
  const { data: profile, error } = await getUserProfile(session.user.id);

  if (error || !profile) {
    console.error("Error fetching user profile:", error);
    return navigateTo("/login");
  }

  const userRole = profile.role;

  // Check if user has the required role
  if (userRole !== requiredRole) {
    console.log("Role mismatch:", {
      required: requiredRole,
      actual: userRole,
      path: to.path,
    });

    // Redirect to the user's correct dashboard
    const correctPath = `/${userRole.toLowerCase()}/dashboard`;

    // Prevent infinite redirect loop
    if (to.path !== correctPath) {
      return navigateTo(correctPath);
    }
  }

  console.log("Role middleware: Access granted", {
    role: userRole,
    path: to.path,
  });
});
