/**
 * tts – Supabase Edge Function
 *
 * Text-to-Speech via ElevenLabs.
 * Keeps ELEVENLABS_API_KEY inside Supabase Edge secrets.
 */
declare const Deno: {
  env: { get: (key: string) => string | undefined };
  serve: (
    handler: (req: Request) => Response | Promise<Response>,
  ) => void;
};

const VOICES: Record<string, string> = {
  patient: "l4Coq6695JDX9xtLqXDE", // Female voice (custom)
  tutor: "ErXwobaYiN019PkySvjV", // Antoni
  system: "pNInz6obpgDQGcFmaJgB", // Adam
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true }, 200);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { text, voiceType, emotion } = await req.json();

    if (!text || !String(text).trim()) {
      return json({ error: "text is required" }, 400);
    }

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return json({ error: "ELEVENLABS_API_KEY not configured" }, 500);
    }

    const cleaned = String(text)
      .replace(/\[.*?\]/g, "")
      .replace(/\(.*?\)/g, "")
      .trim();
    if (!cleaned) {
      return json({ error: "No speakable text after cleaning" }, 400);
    }

    const type = (voiceType as string) ?? "patient";
    const voiceId = VOICES[type] ?? VOICES.patient;
    const emotionNorm = String(emotion ?? "").toLowerCase();

    let stability = 0.5;
    let similarityBoost = 0.75;
    let style = 0.0;

    if (type === "tutor") {
      stability = 0.78;
      similarityBoost = 0.72;
      style = 0.0;
    } else if (
      ["anxious", "worried", "concern", "distress", "scared"].some((k) =>
        emotionNorm.includes(k),
      )
    ) {
      stability = 0.4;
      style = 0.25;
    } else if (
      ["relieved", "grateful", "warm"].some((k) => emotionNorm.includes(k))
    ) {
      stability = 0.55;
      style = 0.15;
    }

    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: cleaned,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
            style,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!elevenRes.ok) {
      const errText = await elevenRes.text().catch(() => "");
      console.error("ElevenLabs error:", elevenRes.status, errText);
      return json({ error: "TTS generation failed" }, 502);
    }

    const audioBuffer = await elevenRes.arrayBuffer();
    const bytes = new Uint8Array(audioBuffer);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    const base64Audio = btoa(binary);

    return json({ audio: base64Audio }, 200);
  } catch (err) {
    console.error("tts edge function error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
