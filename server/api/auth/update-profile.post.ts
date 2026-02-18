import {
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from "#supabase/server";

const NAME_PATTERN = /^[\p{L}][\p{L}' -]*$/u;

const validateName = (label: "First name" | "Last name", value: string) => {
  if (!value) {
    return `${label} is required`;
  }
  if (value.length > 50) {
    return `${label} must be 50 characters or less`;
  }
  if (!NAME_PATTERN.test(value)) {
    return `${label} can only include letters, spaces, apostrophes, and hyphens`;
  }
  return "";
};

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const adminClient = await serverSupabaseServiceRole(event);
  const s = adminClient as any;

  const userId = user?.id || user?.sub;

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      data: {
        message: "User authentication required",
      },
    });
  }

  const body = await readBody<{
    firstName?: string;
    lastName?: string;
  }>(event);

  const firstName = (body.firstName ?? "").trim().replace(/\s+/g, " ");
  const lastName = (body.lastName ?? "").trim().replace(/\s+/g, " ");

  const firstNameError = validateName("First name", firstName);
  if (firstNameError) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: {
        code: "INVALID_FIRST_NAME",
        message: firstNameError,
      },
    });
  }

  const lastNameError = validateName("Last name", lastName);
  if (lastNameError) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: {
        code: "INVALID_LAST_NAME",
        message: lastNameError,
      },
    });
  }

  const { error } = await s
    .from("users")
    .update({
      first_name: firstName,
      last_name: lastName,
      name: `${firstName} ${lastName}`.trim(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Profile update error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        message: "Failed to update profile",
      },
    });
  }

  setResponseStatus(event, 200);
  return {
    success: true,
    message: "Profile updated successfully",
  };
});
