// supabase/functions/send-invitation/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type UserRole = "ADMIN" | "INSTRUCTOR" | "STUDENT";

function canInvite(inviterRole: UserRole | null, targetRole: UserRole) {
  if (inviterRole === "ADMIN") return true;
  if (inviterRole === "INSTRUCTOR" && targetRole === "STUDENT") return true;
  return false;
}

function normalizeEmails(input: string): string[] {
  const parts = input
    .split(/[\s,;]+/g)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(parts));
}

function isValidRole(r: any): r is UserRole {
  return r === "ADMIN" || r === "INSTRUCTOR" || r === "STUDENT";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendWithResend(args: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: args.from,
      to: args.to,
      subject: args.subject,
      html: args.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend error ${res.status}: ${text}`);
  }

  return await res.json().catch(() => ({}));
}

/**
 * CORS: Always return these headers on EVERY response (success + errors).
 */
const ALLOWED_ORIGINS = new Set<string>([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://diseasequest.com",
  "https://www.diseasequest.com",
]);

function corsHeadersFor(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  } as Record<string, string>;
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

function text(req: Request, status: number, body: string) {
  return new Response(body, {
    status,
    headers: {
      ...corsHeadersFor(req),
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeadersFor(req) });
  }

  if (req.method !== "POST") {
    return text(req, 405, "Method not allowed");
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
  const FROM_EMAIL = Deno.env.get("FROM_EMAIL")!;
  const INVITE_ACCEPT_URL_BASE = Deno.env.get("INVITE_ACCEPT_URL_BASE")!;
  const REGISTER_URL = Deno.env.get("REGISTER_URL") ?? "";

  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return json(req, 401, { error: "Unauthorized" });
  }

  const inviterId = userData.user.id;
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const body = await req.json().catch(() => null);
  const emailInput = (body?.email ?? "").toString();
  const role = body?.role;
  const customMessage = (body?.customMessage ?? "").toString().trim();

  if (!emailInput) return json(req, 400, { error: "Missing email" });
  if (!isValidRole(role)) return json(req, 400, { error: "Invalid role" });

  const { data: inviterProfile, error: profErr } = await admin
    .from("users")
    .select("role")
    .eq("id", inviterId)
    .single();

  const inviterRole = (inviterProfile?.role ?? null) as UserRole | null;

  if (profErr || !inviterRole) {
    return json(req, 403, { error: "Inviter role not found" });
  }

  if (!canInvite(inviterRole, role)) {
    return json(req, 403, { error: "Not allowed to invite this role" });
  }

  const emails = normalizeEmails(emailInput).filter(isValidEmail);
  if (emails.length === 0) {
    return json(req, 400, { error: "No valid email(s) provided" });
  }

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  const results = [];

  for (const email of emails) {
    const invitationId = crypto.randomUUID();
    const acceptLink = `${INVITE_ACCEPT_URL_BASE}?token=${invitationId}`;

    await admin.from("invitations").insert({
      id: invitationId,
      email,
      role,
      status: "pending",
      registration_link: acceptLink,
      created_by: inviterId,
      expires_at: expiresAt.toISOString(),
      custom_message: customMessage || null,
    });

    const html = `
      <p>You’ve been invited as <b>${role}</b>.</p>
      <p><a href="${acceptLink}">Accept invitation</a></p>
      <p>After accepting, register at <a href="${REGISTER_URL}">${REGISTER_URL}</a></p>
    `;

    await sendWithResend({
      apiKey: RESEND_API_KEY,
      from: FROM_EMAIL,
      to: email,
      subject: "You’ve been invited to DiseaseQuest",
      html,
    });

    results.push({ email, ok: true });
  }

  return json(req, 200, { ok: true, results });
});
