import type { Database } from "@/assets/types/supabase";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

type InvitationClient = Pick<SupabaseClient<Database>, "from">;
type UserRole = Database["public"]["Enums"]["user_role"];

type DeleteInvitationsInput = {
  email: string | null | undefined;
  role: UserRole;
};

export async function deleteInvitationsForInvitee(
  client: InvitationClient,
  input: DeleteInvitationsInput,
): Promise<PostgrestError | null> {
  const email = input.email?.trim().toLowerCase();
  if (!email) return null;

  const { error } = await (client.from("invitations") as any)
    .delete()
    .ilike("email", email)
    .eq("role", input.role);

  return error ?? null;
}
