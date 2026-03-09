/**
 * POST /api/sessions/:sessionId/progress
 * Marks a session as in_progress and sets started_at if not already set.
 * Called by the "Save & Exit" flow so the UI reflects the correct status.
 */
import { defineEventHandler, createError, getRouterParam } from "h3";
import {
  serverSupabaseClient,
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from "#supabase/server";

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

  const { data: session, error: sessionErr } = await client
    .from("case_sessions")
    .select("id, user_id, status, started_at")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (sessionErr || !session) {
    throw createError({ statusCode: 404, message: "Session not found" });
  }

  if (session.status === "completed" || session.status === "abandoned") {
    return { success: true, status: session.status };
  }

  const serviceClient = serverSupabaseServiceRole(event);

  const update: Record<string, unknown> = {
    status: "in_progress",
  };
  if (!session.started_at) {
    update.started_at = new Date().toISOString();
  }

  const { error: updateErr } = await serviceClient
    .from("case_sessions")
    .update(update)
    .eq("id", sessionId);

  if (updateErr) {
    throw createError({
      statusCode: 500,
      message: `Failed to update session: ${updateErr.message}`,
    });
  }

  return { success: true, status: "in_progress" };
});
