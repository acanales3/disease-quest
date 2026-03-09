/**
 * POST /api/tts
 * Proxies TTS requests to Supabase Edge Function `tts`.
 *
 * Body: { text: string, voiceType: "patient" | "tutor" | "system", emotion?: string }
 */
import { defineEventHandler, createError, readBody } from "h3";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { text, voiceType, emotion, patientSex } = body ?? {};

  if (!text || !text.trim()) {
    throw createError({ statusCode: 400, message: "text is required" });
  }

  const config = useRuntimeConfig(event);
  const supabaseUrl =
    process.env.SUPABASE_URL || config.public?.supabase?.url || "";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    "";

  if (!supabaseUrl || !serviceKey) {
    throw createError({
      statusCode: 500,
      message:
        "Supabase configuration missing (SUPABASE_URL or SUPABASE_SERVICE_KEY)",
    });
  }

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
      body: JSON.stringify({
        text,
        voiceType,
        emotion,
        patientSex,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase tts edge function error:", res.status, errText);
      throw createError({ statusCode: 502, message: "TTS generation failed" });
    }

    const data = await res.json().catch(() => ({}));
    return { audio: data?.audio ?? null };
  } catch (err: unknown) {
    if ((err as Record<string, unknown>).statusCode) throw err; // re-throw createError
    console.error("TTS error:", err);
    throw createError({ statusCode: 500, message: (err as Error).message });
  }
});
