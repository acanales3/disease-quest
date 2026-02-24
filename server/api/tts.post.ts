/**
 * POST /api/tts
 * Text-to-Speech using ElevenLabs API.
 * Returns base64-encoded MP3 audio.
 *
 * Body: { text: string, voiceType: "patient" | "tutor" | "system", emotion?: string }
 */
import { defineEventHandler, createError, readBody } from "h3";

// Voice IDs matching DQAgentMain
const VOICES: Record<string, string> = {
  patient: "EXAVITQu4vr4xnSDxMaL",  // Sarah — warm, friendly female
  tutor: "ErXwobaYiN019PkySvjV",     // Antoni — warm, confident male
  system: "pNInz6obpgDQGcFmaJgB",    // Adam — clear, professional
};

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { text, voiceType, emotion } = body;

  if (!text || !text.trim()) {
    throw createError({ statusCode: 400, message: "text is required" });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw createError({ statusCode: 500, message: "ELEVENLABS_API_KEY not configured" });
  }

  // Clean text — remove bracket/paren tags so they're never spoken
  const cleaned = text
    .replace(/\[.*?\]/g, "")
    .replace(/\(.*?\)/g, "")
    .trim();

  if (!cleaned) {
    throw createError({ statusCode: 400, message: "No speakable text after cleaning" });
  }

  const voiceId = VOICES[voiceType ?? "patient"] ?? VOICES.patient;

  // Emotion-based voice settings
  const emotionNorm = (emotion ?? "").toLowerCase();
  let stability = 0.5;
  let similarityBoost = 0.75;
  let style = 0.0;

  if (voiceType === "tutor") {
    stability = 0.78;
    similarityBoost = 0.72;
    style = 0.0;
  } else {
    if (["anxious", "worried", "concern", "distress", "scared"].some((k) => emotionNorm.includes(k))) {
      stability = 0.4;
      style = 0.25;
    } else if (["relieved", "grateful", "warm"].some((k) => emotionNorm.includes(k))) {
      stability = 0.55;
      style = 0.15;
    }
  }

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
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
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("ElevenLabs error:", res.status, errText);
      throw createError({ statusCode: 502, message: "TTS generation failed" });
    }

    const audioBuffer = await res.arrayBuffer();
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(audioBuffer))
    );

    return { audio: base64Audio };
  } catch (err: unknown) {
    if ((err as Record<string, unknown>).statusCode) throw err; // re-throw createError
    console.error("TTS error:", err);
    throw createError({ statusCode: 500, message: (err as Error).message });
  }
});
