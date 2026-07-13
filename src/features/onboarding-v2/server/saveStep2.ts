/**
 * Onboarding V2 – Step 2 server-side save.
 * Saves services to business_services (replace-all for this business),
 * then advances profiles.onboarding_step to 3.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { isProAccess } from '@/features/pricing';
import { assertFreeTierReplaceAllServiceCount } from '@/features/services/server/freeTierServiceLimit';

export interface Step2ServicePayload {
  name: string;
  price: string;
  durationMinutes: number;
  description?: string | null;
}

export interface SaveStep2Params {
  profileId: string;
  businessProfileId: string;
  services: Step2ServicePayload[];
}

export interface SaveStep2Result {
  success: boolean;
  error?: string;
}

function priceToCents(priceString: string): number | null {
  if (!priceString || !String(priceString).trim()) return null;
  const clean = String(priceString).replace(/[$,\s]/g, '');
  const num = parseFloat(clean);
  if (Number.isNaN(num)) return null;
  return Math.round(num * 100);
}

export async function saveStep2(
  supabase: SupabaseClient,
  params: SaveStep2Params
): Promise<SaveStep2Result> {
  const { profileId, businessProfileId, services } = params;

  if (!businessProfileId?.trim()) {
    return { success: false, error: 'Business profile is required' };
  }

  try {
    // Require at least one service; each must have name, duration, and description
    const validServices = services.filter(
      s =>
        s?.name?.trim() &&
        typeof s.durationMinutes === 'number' &&
        s.durationMinutes >= 30 &&
        s?.description?.trim()
    );
    if (validServices.length === 0) {
      return { success: false, error: 'Add at least one service' };
    }

    const { count: existingCountRaw, error: countError } = await supabase
      .from('business_services')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessProfileId);

    if (countError) {
      return { success: false, error: countError.message };
    }

    const existingCount = existingCountRaw ?? 0;

    const { data: profileRaw } = await supabase
      .from('profiles')
      .select(
        'subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
      )
      .eq('user_id', profileId)
      .maybeSingle();

    const ownerProfile = profileRaw as {
      subscription_tier?: string | null;
      subscription_current_period_end?: string | null;
      subscription_status?: string | null;
      stripe_subscription_id?: string | null;
      stripe_customer_id?: string | null;
    } | null;

    const ownerPro = isProAccess(
      ownerProfile?.subscription_tier,
      ownerProfile?.subscription_current_period_end,
      ownerProfile?.subscription_status,
      ownerProfile?.stripe_subscription_id,
      ownerProfile?.stripe_customer_id
    );

    const replaceGate = assertFreeTierReplaceAllServiceCount(
      existingCount,
      validServices.length,
      ownerPro
    );
    if (!replaceGate.ok) {
      return { success: false, error: replaceGate.error };
    }

    // Build insert rows before delete — price_cents is NOT NULL; validate first so a
    // bad price cannot wipe existing services.
    const rows: Array<{
      business_id: string;
      name: string;
      description: string | null;
      price_cents: number;
      duration_minutes: number;
      is_active: boolean;
    }> = [];
    for (const s of validServices) {
      const cents = priceToCents(s.price ?? '');
      if (cents === null || cents < 0) {
        return {
          success: false,
          error: 'Each service needs a valid price',
        };
      }
      rows.push({
        business_id: businessProfileId,
        name: s.name.trim(),
        description: s.description?.trim() || null,
        price_cents: cents,
        duration_minutes: s.durationMinutes,
        is_active: true,
      });
    }

    // Delete existing services for this business (replace-all)
    const { error: deleteError } = await supabase
      .from('business_services')
      .delete()
      .eq('business_id', businessProfileId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    const { error: insertError } = await supabase
      .from('business_services')
      .insert(rows as never);

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Advance to step 3
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        onboarding_step: 3,
        onboarding_status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profileId);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save services',
    };
  }
}
