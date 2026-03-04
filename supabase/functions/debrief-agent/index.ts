/**
 * Debrief Agent – Supabase Edge Function
 *
 * Generates conversational debrief responses using OpenAI.
 * OPENAI_API_KEY is read from Supabase Edge secrets.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { chatCompletion, type ChatMessage } from "../_shared/openai.ts";

interface DebriefRequest {
  question?: string;
  systemPrompt?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as DebriefRequest;
    const question = body.question?.trim();
    const systemPrompt = body.systemPrompt?.trim();

    if (!question) {
      return new Response(JSON.stringify({ error: "question is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!systemPrompt) {
      return new Response(
        JSON.stringify({ error: "systemPrompt is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ];

    const responseText = await chatCompletion(messages, {
      model: "gpt-4o",
      temperature: 0.7,
      max_tokens: 1500,
    });

    return new Response(
      JSON.stringify({
        response: responseText || "I couldn't generate a debrief response.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Debrief agent error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
