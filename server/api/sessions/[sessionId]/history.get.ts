/**
 * GET /api/sessions/:sessionId/history
 * Returns a summary of all actions taken in the session,
 * used to restore UI state after page refresh.
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
    throw createError({ statusCode: 400, message: "Session ID required" });
  }

  // Verify ownership
  const { data: session } = (await client
    .from("case_sessions")
    .select("id, student_id")
    .eq("id", sessionId)
    .eq("student_id", userId)
    .single()) as { data: { id: string } | null; error: unknown };

  if (!session) {
    throw createError({ statusCode: 404, message: "Session not found" });
  }

  // Get all actions
  const { data: actions } = await client
    .from("session_actions")
    .select("action_type, target, response, elapsed_minutes")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  // Build restore data
  const orderedTests: string[] = [];
  const testResults: Array<{ testId: string; testName: string; data: Record<string, unknown> }> = [];
  const treatments: string[] = [];
  let examFindings: Record<string, unknown> | null = null;

  for (const a of (actions ?? []) as Array<Record<string, unknown>>) {
    const actionType = a.action_type as string;
    const target = a.target as string;
    const response = (a.response ?? {}) as Record<string, unknown>;

    if (actionType === "order_test" && target && response.success) {
      orderedTests.push(target);
    }

    if (actionType === "interpret" && target && response.status === "complete" && response.results) {
      const d = { ...(response.results as Record<string, unknown>) };
      delete d.interpretation;
      delete d.wbc_value;
      testResults.push({
        testId: target,
        testName: (response.test_name ?? target) as string,
        data: d,
      });
    }

    if (actionType === "perform_exam" && response.findings) {
      examFindings = response.findings as Record<string, unknown>;
    }

    if (actionType === "administer" && target) {
      treatments.push(target);
    }
  }

  return {
    orderedTests,
    testResults,
    treatments,
    examFindings,
  };
});
