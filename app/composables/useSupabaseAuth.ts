import { ref } from "vue";
import { useSupabaseClient, useSupabaseUser } from "#imports";
import { useUsers } from "~/composables/useUsers";
import type { User } from "../assets/interface/User";

export default function useSupabaseAuth() {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const { getUserProfile } = useUsers();

  const customUser = ref<User | null>(null);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error, customUser: null };

    // Ensure we have a user ID before fetching profile
    if (!data.user?.id) {
      return {
        error: { message: "No user ID returned from login" },
        customUser: null,
      };
    }

    const { data: profile, error: profileError } = await getUserProfile(
      data.user.id,
    );

    if (profileError) {
      return { error: profileError, customUser: null };
    }

    customUser.value = profile as User;

    return { error: null, customUser: profile as User };
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    customUser.value = null;

    if (error) {
      console.error("Logout error:", error);
      return { error };
    }

    return { error: null };
  };

  /**
   * Fetch the current user's profile from database
   * Useful for getting latest user data or initializing customUser
   */
  const fetchCustomUser = async () => {
    // First check if user ref has a value
    if (!user.value?.id) {
      // If not, get it from session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        console.log("No user ID available");
        customUser.value = null;
        return null;
      }

      // Use session user ID
      const { data: profile, error } = await getUserProfile(session.user.id);

      if (error || !profile) {
        console.error("Error fetching custom user:", error);
        customUser.value = null;
        return null;
      }

      customUser.value = profile as User;
      return profile as User;
    }

    // Use user ref ID if available
    const { data: profile, error } = await getUserProfile(user.value.id);

    if (error || !profile) {
      console.error("Error fetching custom user:", error);
      customUser.value = null;
      return null;
    }

    customUser.value = profile as User;
    return profile as User;
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: string): boolean => {
    if (!customUser.value) return false;
    return customUser.value.role === role;
  };

  /**
   * Check if user is authenticated with a valid profile
   */
  const isAuthenticated = (): boolean => {
    return !!(user.value && customUser.value && customUser.value.role);
  };

  // user is the auth service user that is handled by supabase
  // customUser is our custom user from our interface that we make
  return {
    user,
    customUser,
    login,
    logout,
    fetchCustomUser,
    hasRole,
    isAuthenticated,
  };
}
