/**
 * Patient Agent – Supabase Edge Function
 *
 * Simulates the patient's parent/guardian for pediatric cases.
 * Uses progressive disclosure: only reveals information from unlocked disclosures.
 * Called internally by the orchestrator.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { chatCompletion, type ChatMessage } from "../_shared/openai.ts";

interface PatientAgentRequest {
  question: string;
  patientState: Record<string, unknown>;
  unlockedDisclosures: string[];
  disclosures: Array<{ id: string; content: Record<string, unknown> }>;
  conversationHistory: Array<{ role: string; content: string }>;
  elapsedMinutes: number;
}

function buildSystemPrompt(ps: Record<string, unknown>): string {
  const physiology = (ps.physiology ?? {}) as Record<string, unknown>;
  const vitals = (physiology.vitals ?? {}) as Record<string, unknown>;
  const socialCtx = (ps.social_context ?? {}) as Record<string, unknown>;

  const socialLines = Object.entries(socialCtx)
    .map(([k, v]) => {
      const label = k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return typeof v === "boolean" ? `- ${label}: ${v ? "Yes" : "No"}` : `- ${label}: ${v}`;
    })
    .join("\n");

  const rosPositives = ((ps.ros_positives ?? []) as string[]).join(", ");
  const rosNegatives = ((ps.ros_negatives ?? []) as string[]).join(", ");

  return `You are the parent/guardian of a sick infant in a medical simulation for training medical students.

You are speaking on behalf of ${ps.name ?? "the patient"}, a ${ps.age_months ?? "unknown"}-month-old.

CRITICAL RULES – YOU MUST FOLLOW THESE:
1. NEVER volunteer diagnostic information or suggest what might be wrong
2. NEVER suggest tests or treatments
3. NEVER use medical terminology unless the student uses it first
4. Only answer what is directly asked – do not elaborate beyond the question
5. Express appropriate emotions (worry, fear, frustration) naturally
6. If asked something you don't know or wasn't disclosed, say you don't know
7. Be consistent with all previous answers
8. React realistically to the student's bedside manner

PATIENT INFORMATION:
- Chief Complaint: ${ps.chief_complaint ?? "Unknown"}
- Emotional State: ${ps.emotional_state ?? "anxious"}
- Cooperation Level: ${ps.cooperation_level ?? "cooperative"}

SOCIAL CONTEXT:
${socialLines || "No specific social context provided."}

SYMPTOMS TO REPORT (only when asked):
- Positive findings: ${rosPositives || "None"}
- Negative findings (deny if asked): ${rosNegatives || "None"}

CURRENT PHYSICAL STATE:
- Temperature: ${vitals.temp_f ?? "unknown"}°F
- Mental Status: ${physiology.mental_status ?? "unknown"}
- Visible Signs: ${physiology.rash ?? "None visible"}

COMMUNICATION STYLE:
- Use simple, everyday language
- Express worry and concern naturally
- If the student is dismissive or rude, become less cooperative
- If the student is empathetic, open up more

Remember: You are NOT a medical professional. You don't know what's wrong. You're scared and want help.`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: PatientAgentRequest = await req.json();
    const { question, patientState, conversationHistory, elapsedMinutes } = body;

    const systemPrompt = buildSystemPrompt(patientState);

    // Build conversation messages
    const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }];

    // Add last 10 conversation turns for context
    const recentHistory = (conversationHistory ?? []).slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === "student") {
        messages.push({ role: "user", content: msg.content });
      } else if (msg.role === "patient") {
        messages.push({ role: "assistant", content: msg.content });
      }
    }

    // Add current question
    messages.push({
      role: "user",
      content: `[Elapsed: ${elapsedMinutes} min] ${question}`,
    });

    const responseText = await chatCompletion(messages, { temperature: 0.8 });

    return new Response(
      JSON.stringify({
        response: responseText,
        speaker: "parent",
        emotional_state: patientState.emotional_state ?? "anxious",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Patient agent error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
