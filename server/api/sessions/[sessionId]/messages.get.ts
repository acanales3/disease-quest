/**
 * GET /api/sessions/:sessionId/messages
 * Returns conversation history for a session.
 */
import { defineEventHandler, createError, getRouterParam } from "h3";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);
  // @ts-ignore
  const userId = user?.id || user?.sub;

  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const sessionId = getRouterParam(event, "sessionId");
  if (!sessionId) {
    throw createError({ statusCode: 400, message: "Session ID is required" });
  }

  // Verify session ownership
  const { data: session, error: sessionErr } = await client
    .from("case_sessions")
    .select("id, student_id")
    .eq("id", sessionId)
    .eq("student_id", userId)
    .single();

  if (sessionErr || !session) {
    throw createError({ statusCode: 404, message: "Session not found" });
  }

  // Fetch messages
  const { data: messages, error: msgErr } = await client
    .from("session_messages")
    .select("id, role, content, metadata, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (msgErr) {
    throw createError({ statusCode: 500, message: msgErr.message });
  }

  return messages ?? [];
});
