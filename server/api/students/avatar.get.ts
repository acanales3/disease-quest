import {
  serverSupabaseUser,
  serverSupabaseServiceRole,
} from "#supabase/server";

const BUCKET = "avatars";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const userId = user.id || (user as any).sub;
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const serviceRole = serverSupabaseServiceRole(event) as any;
  const storagePath = `${userId}.png`;

  // Check query param to force regeneration
  const query = getQuery(event);
  const forceRegenerate = query.regenerate === "true";

  if (forceRegenerate) {
    console.log(`[AVATAR] Force regenerating avatar for user ${userId}`);
    const { data: existing } = await serviceRole.storage
      .from(BUCKET)
      .list("", { search: userId });

    const pathsToRemove = (existing || [])
      .map((file: any) => file?.name)
      .filter((name: string | undefined) => !!name && name.startsWith(userId));

    if (pathsToRemove.length) {
      await serviceRole.storage.from(BUCKET).remove(pathsToRemove);
      console.log(`[AVATAR] Removed existing avatar variants:`, pathsToRemove);
    }
  }

  // Check if avatar already exists in storage
  const { data: files } = await serviceRole.storage
    .from(BUCKET)
    .list("", { search: `${userId}.png` });

  const matchedFile = files?.find((file: any) => file.name === `${userId}.png`);
  const fileVersion =
    matchedFile?.updated_at || matchedFile?.created_at || null;

  console.log(`[AVATAR] Storage check for ${storagePath}:`, files?.length ?? 0, "files found");

  if (!forceRegenerate && matchedFile) {
    const { data: urlData } = serviceRole.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);
    const cacheBustedUrl = fileVersion
      ? `${urlData.publicUrl}?v=${encodeURIComponent(fileVersion)}`
      : urlData.publicUrl;

    console.log(`[AVATAR] Returning cached avatar: ${cacheBustedUrl}`);
    return { avatarUrl: cacheBustedUrl, generating: false };
  }

  // Avatar doesn't exist yet — check nickname and kick off generation
  const { data: student } = await serviceRole
    .from("students")
    .select("nickname")
    .eq("user_id", userId)
    .single();

  if (!student?.nickname) {
    console.log("[AVATAR] No nickname set, skipping generation");
    return { avatarUrl: null, generating: false };
  }

  console.log(`[AVATAR] Triggering edge function generate-avatar for nickname: "${student.nickname}", model: gpt-image-1`);

  // Fire-and-forget: trigger edge function without awaiting
  serviceRole.functions
    .invoke("generate-avatar", {
      body: { nickname: student.nickname, userId },
    })
    .then((res: any) => {
      console.log("[AVATAR] Edge function response:", JSON.stringify(res.data));
    })
    .catch((err: any) => console.error("[AVATAR] Edge function error:", err));

  return { avatarUrl: null, generating: true };
});
