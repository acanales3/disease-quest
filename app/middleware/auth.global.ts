export default defineNuxtRouteMiddleware(async (to, from) => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/", "/register"];

  // If route is public, allow access
  if (publicRoutes.includes(to.path)) {
    return;
  }

  // Wait for Supabase to initialize and get the session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if user is authenticated
  if (!session?.user) {
    console.log("No authenticated user, redirecting to login");
    return navigateTo("/login");
  }

  console.log("Auth middleware: User authenticated", {
    userId: session.user.id,
    email: session.user.email,
  });
});
