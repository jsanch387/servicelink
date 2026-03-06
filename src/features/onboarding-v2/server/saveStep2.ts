/**
 * Onboarding V2 – Step 2 server-side save.
 * Saves services to business_services (replace-all for this business),
 * then advances profiles.onboarding_step to 3.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

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

    // Delete existing services for this business (replace-all)
    const { error: deleteError } = await supabase
      .from('business_services')
      .delete()
      .eq('business_id', businessProfileId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Insert all services (duration in minutes only; hours_to_complete is deprecated)
    const rows = validServices.map(s => ({
      business_id: businessProfileId,
      name: s.name.trim(),
      description: s.description?.trim() || null,
      price_cents: priceToCents(s.price ?? '') ?? null,
      duration_minutes: s.durationMinutes,
      is_active: true,
    }));

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
