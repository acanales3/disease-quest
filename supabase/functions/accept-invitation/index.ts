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

  const { data: invite, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("id", token)
    .single();

  if (error || !invite) {
    return Response.redirect(`${REGISTER_URL}?invite=invalid`, 302);
  }

  const expiresAt = new Date(
    invite.expires_at.endsWith("Z")
      ? invite.expires_at
      : invite.expires_at + "Z",
  );
  if (expiresAt < new Date()) {
    await supabase
      .from("invitations")
      .update({ status: "expired" })
      .eq("id", invite.id);
    return Response.redirect(`${REGISTER_URL}?invite=expired`, 302);
  }

  if (invite.accepted_at || invite.status === "accepted") {
    return Response.redirect(`${REGISTER_URL}?invite=already`, 302);
  }

  await supabase
    .from("invitations")
    .update({
      accepted_at: new Date().toISOString(),
      status: "accepted",
    })
    .eq("id", invite.id);

  return Response.redirect(
    `${REGISTER_URL}?invite=accepted&email=${encodeURIComponent(invite.email)}`,
    302,
  );
});
