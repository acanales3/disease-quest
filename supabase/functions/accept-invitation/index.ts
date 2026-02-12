import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token"); // invitation id (uuid)

  if (!token) {
    return new Response("Missing token.", { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  // fetch invitation
  const { data: inv, error: invErr } = await admin
    .from("invitations")
    .select("id,email,status,expires_at,created_by")
    .eq("id", token)
    .single();

  if (invErr || !inv) {
    return new Response("Invalid invitation token.", { status: 404 });
  }

  const now = new Date();
  if (inv.status !== "pending") {
    return html(`Invitation already ${inv.status}. You can close this tab.`);
  }
  if (new Date(inv.expires_at) <= now) {
    // optionally mark expired
    await admin
      .from("invitations")
      .update({ status: "expired" })
      .eq("id", inv.id);
    return html("Invitation expired. Please request a new invite.");
  }

  // accept
  await admin
    .from("invitations")
    .update({ status: "accepted", accepted_at: now.toISOString() })
    .eq("id", inv.id);

  // notify inviter (inviter exists in public.users)
  await admin.from("notifications").insert({
    user_id: inv.created_by,
    message: `${inv.email} accepted the invitation.`,
  });

  return html(
    "Invitation accepted. You can now register on the DiseaseQuest site.",
  );
});

function html(message: string) {
  return new Response(
    `<!doctype html><html><body style="font-family:system-ui;padding:24px">
      <h2>${escapeHtml(message)}</h2>
    </body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
