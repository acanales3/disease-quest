import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET = "avatars";

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = new Set([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://diseasequest.com",
    "https://www.diseasequest.com",
  ]);
  return {
    "Access-Control-Allow-Origin": allowed.has(origin) ? origin : "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  } as Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders(req),
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => null);
    const nickname = body?.nickname;
    const userId = body?.userId;

    if (!nickname || !userId) {
      return new Response(
        JSON.stringify({ error: "nickname and userId are required" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const storagePath = `${userId}.png`;

    // Check if avatar already exists
    const { data: files } = await admin.storage
      .from(BUCKET)
      .list("", { search: `${userId}.png` });

    if (files && files.length > 0) {
      const { data: urlData } = admin.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      return new Response(
        JSON.stringify({ avatarUrl: urlData.publicUrl }),
        { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const prompt = `A cute, minimal, flat-style illustration of a ${nickname}. The background MUST be fully transparent with absolutely no background color, no white background, no gray background, no circles or shapes behind the character. Only the character itself should be visible with nothing behind it. Friendly character design suitable as a profile avatar. Clean vector art style, centered composition, no text, no shadows, no ground.`;

    const openaiRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "medium",
        background: "transparent",
        output_format: "png",
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => "");
      console.error("OpenAI error:", openaiRes.status, errText);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${openaiRes.status}` }),
        { status: 502, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const openaiData = await openaiRes.json();
    const b64 = openaiData.data?.[0]?.b64_json;

    if (!b64) {
      return new Response(
        JSON.stringify({ error: "No image data returned from OpenAI" }),
        { status: 502, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    // Decode base64 to Uint8Array for upload
    const binaryStr = atob(b64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Ensure bucket exists
    await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
    });

    // Remove any old variants for this user (legacy keys/extensions) before upload.
    const { data: existingVariants } = await admin.storage
      .from(BUCKET)
      .list("", { search: userId });
    const variantPaths = (existingVariants || [])
      .map((file: any) => file?.name)
      .filter((name: string | undefined) => !!name && name.startsWith(userId));
    if (variantPaths.length > 0) {
      await admin.storage.from(BUCKET).remove(variantPaths);
      console.log("Removed old avatar variants:", variantPaths);
    }

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, bytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload failed:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload avatar to storage" }),
        { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const { data: urlData } = admin.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    return new Response(
      JSON.stringify({ avatarUrl: urlData.publicUrl }),
      { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("generate-avatar error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
    );
  }
});
