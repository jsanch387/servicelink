import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type InstagramMessagingChannelRow = {
  id: string;
  business_id: string;
  instagram_account_id: string;
  facebook_page_id: string;
  facebook_page_name: string | null;
  instagram_username: string | null;
  page_access_token: string;
  connected_by_user_id: string | null;
  connected_at: string;
  disconnected_at: string | null;
  updated_at: string;
};

export type InstagramMessagingChannelPublic = {
  instagramAccountId: string;
  facebookPageId: string;
  facebookPageName: string | null;
  instagramUsername: string | null;
  connectedAt: string;
};

/**
 * PostgREST helper — `instagram_messaging_channels` is not in generated Database types yet.
 */
export function instagramMessagingChannelsOf(
  supabase: SupabaseClient<Database>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see module docstring
  return (supabase as unknown as SupabaseClient<any>).from(
    'instagram_messaging_channels'
  );
}

export function mapChannelRowToPublic(
  row: Pick<
    InstagramMessagingChannelRow,
    | 'instagram_account_id'
    | 'facebook_page_id'
    | 'facebook_page_name'
    | 'instagram_username'
    | 'connected_at'
  >
): InstagramMessagingChannelPublic {
  return {
    instagramAccountId: row.instagram_account_id,
    facebookPageId: row.facebook_page_id,
    facebookPageName: row.facebook_page_name,
    instagramUsername: row.instagram_username,
    connectedAt: row.connected_at,
  };
}
