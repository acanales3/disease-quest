import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const REGISTER_URL = Deno.env.get("REGISTER_URL")!;

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response("Missing token", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1 Find invitation
  const { data: invite, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !invite) {
    return Response.redirect(`${REGISTER_URL}?invite=invalid`, 302);
  }

  // 2 Check expiration
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return Response.redirect(`${REGISTER_URL}?invite=expired`, 302);
  }

  // 3 Check if already accepted
  if (invite.accepted_at) {
    return Response.redirect(`${REGISTER_URL}?invite=already`, 302);
  }

  // 4 Mark accepted
  await supabase
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  // 5 Redirect to your Nuxt register page
  return Response.redirect(
    `${REGISTER_URL}?invite=accepted&email=${encodeURIComponent(invite.email)}`,
    302,
  );
});
