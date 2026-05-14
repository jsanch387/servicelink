/**
 * Server-only Expo push: load tokens for a user and POST to Expo Push API.
 * Best-effort — logs warnings on failure; does not throw to callers.
 */

import { logExpoPush } from '@/features/push/server/pushTransactionLog';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100;

export type ExpoPushDeepLinkData = {
  reference_type: string;
  reference_id: string;
};

type ExpoPushMessage = {
  to: string;
  title: string;
  body?: string;
  data: Record<string, string>;
};

async function postExpoBatch(
  accessToken: string,
  messages: ExpoPushMessage[]
): Promise<void> {
  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(messages),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    logExpoPush('warn', 'expo_http_error', {
      status: res.status,
      bodyPreview: text.slice(0, 500),
    });
    return;
  }

  const json = (await res.json().catch(() => null)) as {
    data?: Array<{ status?: string; message?: string }>;
  } | null;
  const errors = json?.data?.filter(d => d.status === 'error') ?? [];
  if (errors.length > 0) {
    logExpoPush('warn', 'expo_ticket_errors', {
      count: errors.length,
      sample: errors.slice(0, 3),
    });
  }
}

/**
 * Sends one Expo message per device token for `userId`.
 * Requires `EXPO_ACCESS_TOKEN` in the environment; no-ops when missing.
 */
export async function sendExpoPushToUser(
  admin: SupabaseClient<Database>,
  params: {
    userId: string;
    title: string;
    body: string | null;
    data: ExpoPushDeepLinkData;
  }
): Promise<void> {
  const accessToken = process.env.EXPO_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    return;
  }

  const { userId, title, body, data } = params;

  const { data: rows, error } = await admin
    .from('user_push_tokens')
    .select('expo_push_token')
    .eq('user_id', userId);

  if (error) {
    logExpoPush('warn', 'token_query_failed', {
      userId,
      message: error.message,
      code: error.code,
    });
    return;
  }

  type TokenPick = Pick<
    Database['public']['Tables']['user_push_tokens']['Row'],
    'expo_push_token'
  >;
  const tokenRows = (rows ?? []) as TokenPick[];

  const tokens = tokenRows
    .map(r => r.expo_push_token?.trim())
    .filter((t): t is string => Boolean(t));

  if (tokens.length === 0) {
    return;
  }

  const dataStrings: Record<string, string> = {
    reference_type: data.reference_type,
    reference_id: data.reference_id,
    referenceType: data.reference_type,
    referenceId: data.reference_id,
  };

  const bodyTrimmed = body?.trim() ? body.trim() : null;

  const messages: ExpoPushMessage[] = tokens.map(to => {
    const msg: ExpoPushMessage = {
      to,
      title,
      data: dataStrings,
    };
    if (bodyTrimmed) {
      msg.body = bodyTrimmed;
    }
    return msg;
  });

  try {
    for (let i = 0; i < messages.length; i += EXPO_BATCH_SIZE) {
      const chunk = messages.slice(i, i + EXPO_BATCH_SIZE);
      await postExpoBatch(accessToken, chunk);
    }
  } catch (e) {
    logExpoPush('warn', 'expo_send_exception', {
      userId,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
