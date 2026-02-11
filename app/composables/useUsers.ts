import { useSupabaseClient } from "#imports";

export const useUsers = () => {
  const supabase = useSupabaseClient();

  const getUserProfile = async (id: string) => {
    const s = supabase as any; // IMPORTANT: bypass table type constraints (maybe change later for type safety)

    return await s.from("users").select("*").eq("id", id).single();
  };

  return { getUserProfile };
};
