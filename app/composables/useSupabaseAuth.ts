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

    const { data: profile, error: profileError } = await getUserProfile(
      data.user.id
    );

    if (profileError) {
      return { error: profileError, customUser: null };
    }

    customUser.value = profile as User;

    return { error: null, customUser: profile as User };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    customUser.value = null;
  };

  // user is the auth service user that is handeled by supabase
  // customUser is our custom user from our interface that we make
  return {
    user,
    customUser,
    login,
    logout,
  };
}
