/**
 * POST /api/meta/instagram/disconnect
 *
 * Marks the business Instagram channel disconnected (clears active token use).
 */

import { instagramMessagingChannelsOf } from '@/features/automation/server/instagramMessagingChannelsQuery';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextRequest, NextResponse } from 'next/server';

const LOG = '[meta:instagram-disconnect]';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const businessResolved = await resolveCurrentBusinessId(auth.supabase);
    if (!businessResolved.ok) {
      return NextResponse.json(
        { success: false, error: businessResolved.error },
        { status: businessResolved.status }
      );
    }

    const admin = createSupabaseAdminClient();
    const now = new Date().toISOString();

    const { error } = await instagramMessagingChannelsOf(admin)
      .update({
        disconnected_at: now,
        updated_at: now,
        page_access_token: '',
      })
      .eq('business_id', businessResolved.businessId)
      .is('disconnected_at', null);

    if (error) {
      console.error(`${LOG} update failed`, error);
      return NextResponse.json(
        { success: false, error: 'Could not disconnect Instagram' },
        { status: 500 }
      );
    }

    console.log(`${LOG} disconnected`, {
      businessId: businessResolved.businessId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`${LOG} failed`, error);
    return NextResponse.json(
      { success: false, error: 'Could not disconnect Instagram' },
      { status: 500 }
    );
  }
}
