/**
 * Diagnostic Agent – Supabase Edge Function
 *
 * Pure logic (no LLM). Handles test ordering, prerequisite checking,
 * and result retrieval from the case definition.
 * Called internally by the orchestrator.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface DiagnosticTest {
  id: string;
  display_name: string;
  cost_points: number;
  tat_minutes: number;
  prerequisites?: string[];
  result_schema: string[];
}

interface TestOrder {
  testId: string;
  orderedAt: number;
  resultAvailableAt: number;
}

interface DiagnosticRequest {
  action: "order" | "get_results" | "get_all_results" | "list_available";
  testId?: string;
  rationale?: string;
  elapsedMinutes: number;
  diagnosticTests: DiagnosticTest[];
  testResults: Record<string, Record<string, unknown>>;
  orderedTests: Record<string, TestOrder>;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: DiagnosticRequest = await req.json();
    const {
      action,
      testId,
      rationale,
      elapsedMinutes,
      diagnosticTests,
      testResults,
      orderedTests,
    } = body;

    const testsById = new Map(diagnosticTests.map((t) => [t.id, t]));

    if (action === "list_available") {
      const available = diagnosticTests.map((t) => ({
        id: t.id,
        name: t.display_name,
        cost_points: t.cost_points,
        turnaround_minutes: t.tat_minutes,
        prerequisites: t.prerequisites ?? [],
      }));
      return json({ success: true, available_tests: available });
    }

    if (action === "order") {
      if (!testId) return json({ success: false, error: "No test_id provided" });
      const test = testsById.get(testId);
      if (!test) {
        return json({
          success: false,
          error: `Test '${testId}' is not available. Please check the test catalog.`,
        });
      }

      // Check if already ordered
      if (orderedTests[testId]) {
        return json({
          success: false,
          error: `Test '${testId}' has already been ordered.`,
        });
      }

      const order: TestOrder = {
        testId,
        orderedAt: elapsedMinutes,
        resultAvailableAt: elapsedMinutes + test.tat_minutes,
      };

      return json({
        success: true,
        test_id: testId,
        test_name: test.display_name,
        ordered_at: elapsedMinutes,
        expected_result_at: order.resultAvailableAt,
        turnaround_minutes: test.tat_minutes,
        cost_points: test.cost_points,
        order,
        message: `${test.display_name} ordered. Results expected in ${test.tat_minutes} minute(s).`,
      });
    }

    if (action === "get_results") {
      if (!testId) return json({ success: false, error: "No test_id provided" });
      const order = orderedTests[testId];
      if (!order) {
        return json({ success: false, error: `Test '${testId}' has not been ordered.` });
      }

      if (elapsedMinutes < order.resultAvailableAt) {
        const remaining = order.resultAvailableAt - elapsedMinutes;
        return json({
          success: true,
          status: "pending",
          test_id: testId,
          message: `Results pending. Expected in ${remaining} minute(s).`,
        });
      }

      const results = testResults[testId];
      if (!results) {
        return json({ success: false, error: `Results for '${testId}' not available in this case.` });
      }

      const test = testsById.get(testId);
      return json({
        success: true,
        status: "complete",
        test_id: testId,
        test_name: test?.display_name ?? testId,
        results,
        collected_at: order.orderedAt,
        reported_at: elapsedMinutes,
      });
    }

    if (action === "get_all_results") {
      const allResults: Array<Record<string, unknown>> = [];
      for (const [tid, order] of Object.entries(orderedTests)) {
        if (elapsedMinutes >= order.resultAvailableAt && testResults[tid]) {
          const test = testsById.get(tid);
          allResults.push({
            success: true,
            status: "complete",
            test_id: tid,
            test_name: test?.display_name ?? tid,
            results: testResults[tid],
            collected_at: order.orderedAt,
            reported_at: elapsedMinutes,
          });
        }
      }
      return json({ success: true, results: allResults });
    }

    return json({ success: false, error: `Unknown action: ${action}` });
  } catch (err) {
    console.error("Diagnostic agent error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
