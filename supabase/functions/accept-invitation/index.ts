import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type InvitationStatus = "pending" | "accepted" | "expired";

const ALLOWED_ORIGINS = new Set<string>([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

function corsHeadersFor(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  } as Record<string, string>;
}

function html(req: Request, status: number, body: string) {
  return new Response(body, {
    status,
    headers: {
      ...corsHeadersFor(req),
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersFor(req),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
}

function pageTemplate(opts: {
  title: string;
  message: string;
  registerUrl?: string;
}) {
  const { title, message, registerUrl } = opts;
  const safeRegister = registerUrl ? escapeHtml(registerUrl) : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background:#f7f7fb; margin:0; }
    .wrap { max-width: 720px; margin: 48px auto; padding: 0 16px; }
    .card { background:white; border-radius: 14px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
    h1 { margin: 0 0 12px; font-size: 22px; }
    p { margin: 0 0 14px; color: #333; line-height: 1.45; }
    a.button { display: inline-block; padding: 10px 14px; border-radius: 10px; background: #7c3aed; color: white; text-decoration: none; }
    .muted { color:#666; font-size: 13px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
      ${
        safeRegister
          ? `<p><a class="button" href="${safeRegister}">Go to Registration</a></p>
             <p class="muted">If the button doesn’t work, copy/paste: ${safeRegister}</p>`
          : `<p class="muted">Now go to the DiseaseQuest site and register.</p>`
      }
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

Deno.serve(async (req) => {
  // Preflight (not strictly needed for email-click GET, but nice for browser testing)
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeadersFor(req) });
  }

  // Support GET (email link click) and optionally POST (if you ever call it programmatically)
  if (req.method !== "GET" && req.method !== "POST") {
    return html(
      req,
      405,
      pageTemplate({
        title: "Method Not Allowed",
        message: "This endpoint only supports GET/POST.",
      }),
    );
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const REGISTER_URL = Deno.env.get("REGISTER_URL") ?? "";

  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";

  if (!token || !isUuid(token)) {
    return html(
      req,
      400,
      pageTemplate({
        title: "Invalid invitation link",
        message: "This invitation link is missing or invalid.",
        registerUrl: REGISTER_URL || undefined,
      }),
    );
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Load invitation
  const { data: invite, error: invErr } = await admin
    .from("invitations")
    .select("id, email, role, status, expires_at, created_by, accepted_at")
    .eq("id", token)
    .maybeSingle();

  if (invErr) {
    return html(
      req,
      500,
      pageTemplate({
        title: "Server error",
        message: `Could not load invitation. ${invErr.message}`,
        registerUrl: REGISTER_URL || undefined,
      }),
    );
  }

  if (!invite) {
    return html(
      req,
      404,
      pageTemplate({
        title: "Invitation not found",
        message: "This invitation does not exist.",
        registerUrl: REGISTER_URL || undefined,
      }),
    );
  }

  const now = new Date();
  const expiresAt = new Date(invite.expires_at);

  // If expired, mark expired (idempotent)
  if (expiresAt.getTime() <= now.getTime()) {
    if ((invite.status as InvitationStatus) !== "expired") {
      await admin
        .from("invitations")
        .update({ status: "expired" })
        .eq("id", invite.id);
    }

    return html(
      req,
      410,
      pageTemplate({
        title: "Invitation expired",
        message:
          "This invitation has expired. Please request a new invitation.",
        registerUrl: REGISTER_URL || undefined,
      }),
    );
  }

  // Already accepted
  if ((invite.status as InvitationStatus) === "accepted") {
    return html(
      req,
      200,
      pageTemplate({
        title: "Invitation already accepted",
        message:
          "You’ve already accepted this invitation. You can register now.",
        registerUrl: REGISTER_URL || undefined,
      }),
    );
  }

  // Must be pending to accept
  if ((invite.status as InvitationStatus) !== "pending") {
    return html(
      req,
      400,
      pageTemplate({
        title: "Invitation not valid",
        message: `This invitation cannot be accepted (status: ${invite.status}).`,
        registerUrl: REGISTER_URL || undefined,
      }),
    );
  }

  // Accept it
  const { error: updErr } = await admin
    .from("invitations")
    .update({
      status: "accepted",
      accepted_at: now.toISOString(),
    })
    .eq("id", invite.id);

  if (updErr) {
    return html(
      req,
      500,
      pageTemplate({
        title: "Server error",
        message: `Could not accept invitation. ${updErr.message}`,
        registerUrl: REGISTER_URL || undefined,
      }),
    );
  }

  // Notify inviter (best-effort)
  await admin.from("notifications").insert({
    user_id: invite.created_by,
    message: `Invitation accepted by ${invite.email} (${invite.role}).`,
  });

  return html(
    req,
    200,
    pageTemplate({
      title: "Invitation accepted",
      message:
        "Your invitation has been accepted. You can now register your account.",
      registerUrl: REGISTER_URL || undefined,
    }),
  );
});
