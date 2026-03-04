/**
 * Case Generator – Supabase Edge Function
 *
 * Receives extracted PDF text + case metadata, calls OpenAI o4-mini
 * to generate a full DiseaseQuest simulation case JSON.
 * The OPENAI_API_KEY is stored as a Supabase secret — never exposed client-side.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

declare const Deno: {
  env: { get: (key: string) => string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return json({ error: "OPENAI_API_KEY not configured in edge function secrets." }, 500);
    }

    const { systemPrompt, userPrompt } = await req.json() as {
      systemPrompt: string;
      userPrompt: string;
    };

    if (!systemPrompt || !userPrompt) {
      return json({ error: "systemPrompt and userPrompt are required." }, 400);
    }

    const body = {
      model: "o4-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 16000,
    };

    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      return json({ error: `OpenAI API error (${res.status}): ${errText}` }, 502);
    }

    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: Record<string, number>;
    };

    const content = data.choices?.[0]?.message?.content ?? "";
    return json({ content, usage: data.usage ?? {} });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: `Case generator error: ${msg}` }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
