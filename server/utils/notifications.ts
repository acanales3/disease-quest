import type { Database, TablesInsert } from "@/assets/types/supabase";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

type NotificationClient = Pick<SupabaseClient<Database>, "from">;
type NotificationInsert = TablesInsert<"notifications">;

export type NotificationLogInput = {
  recipientUserId: string;
  message: string;
  timestampSent?: string | null;
};

function toNotificationRow(input: NotificationLogInput): NotificationInsert {
  const message = input.message?.trim();

  if (!message) {
    throw new Error("Notification message is required.");
  }

  return {
    user_id: input.recipientUserId,
    message,
    ...(input.timestampSent !== undefined
      ? { timestamp_sent: input.timestampSent }
      : {}),
  };
}

export async function logNotifications(
  client: NotificationClient,
  inputs: NotificationLogInput[],
): Promise<PostgrestError | null> {
  if (!inputs.length) return null;

  const rows = inputs.map(toNotificationRow);
  const { error } = await (client.from("notifications") as any).insert(rows);
  return error ?? null;
}

export async function logNotification(
  client: NotificationClient,
  input: NotificationLogInput,
): Promise<PostgrestError | null> {
  return await logNotifications(client, [input]);
}
