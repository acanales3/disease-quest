import {
  serverSupabaseUser,
  serverSupabaseServiceRole,
} from "#supabase/server";
import { generateUniqueNickname } from "../../utils/nickname-generator";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  // @ts-ignore
  const userId = user.id || user.sub;
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const client = serverSupabaseServiceRole(event);

  const { data: student, error: fetchError } = await (client as any)
    .from("students")
    .select("user_id")
    .eq("user_id", userId)
    .single();

  if (fetchError || !student) {
    throw createError({
      statusCode: 404,
      statusMessage: "Student record not found",
    });
  }

  const body = await readBody(event);
  const customNickname = typeof body?.nickname === "string"
    ? body.nickname.trim()
    : null;

  let nickname: string;

  if (customNickname) {
    if (customNickname.length < 2 || customNickname.length > 30) {
      throw createError({
        statusCode: 400,
        statusMessage: "Nickname must be between 2 and 30 characters",
      });
    }

    const { data: existing } = await (client as any)
      .from("students")
      .select("user_id")
      .eq("nickname", customNickname)
      .neq("user_id", userId)
      .maybeSingle();

    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage: "That nickname is already taken",
      });
    }

    nickname = customNickname;
  } else {
    nickname = await generateUniqueNickname(client);
  }

  const { error: updateError } = await (client as any)
    .from("students")
    .update({ nickname })
    .eq("user_id", userId);

  if (updateError) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update nickname",
    });
  }

  return { nickname };
});
