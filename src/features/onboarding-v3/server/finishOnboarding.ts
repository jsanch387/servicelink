import { sanitizeBusinessSpecialties } from '@/constants/businessSpecialties';
import {
  canonicalizeBusinessType,
  isAllowedBusinessTypeValue,
} from '@/constants/businessTypes';
import { DEFAULT_SCHEDULE } from '@/features/availability/types/availability';
import {
  getAvailabilityForBusiness,
  upsertAvailabilityForBusiness,
} from '@/features/availability/services/availabilityService';
import { SlugService } from '@/features/business-profile/services/slugService';
import { completeOnboardingV2WithWelcomeLiveEmail } from '@/features/onboarding-v2/server/completeOnboarding';
import { sampleServiceForTrade } from '@/features/onboarding-preview/sampleServices';
import { FREE_MAX_SERVICES } from '@/features/pricing';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

import { onboardingSlugCandidate } from './onboardingSlug';
import { requireV3Flow } from './requireV3Flow';

export interface FinishOnboardingParams {
  profileId: string;
  userEmail: string | null;
  businessName: string;
  slug: string;
  phoneDigits: string;
  industry: string;
  trades: string[];
}

export interface FinishOnboardingResult {
  success: boolean;
  slug?: string;
  businessProfileId?: string;
  error?: string;
  statusCode?: number;
}

function slugErrorCanRetry(error: string | undefined): boolean {
  const message = (error ?? '').toLowerCase();
  return message.includes('taken') || message.includes('reserved');
}

async function claimSlug(
  slugService: SlugService,
  businessProfileId: string,
  preferred: string
): Promise<{ slug?: string; error?: string }> {
  const base = onboardingSlugCandidate(preferred, 0);
  if (base.length < 3) {
    return { error: 'Pick a longer link name' };
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = onboardingSlugCandidate(base, attempt);
    const result = await slugService.createBusinessSlug(
      businessProfileId,
      candidate
    );
    if (result.success && result.data?.slug) {
      return { slug: result.data.slug };
    }
    if (!slugErrorCanRetry(result.error)) {
      return { error: result.error ?? 'Could not save your link' };
    }
  }

  return { error: 'Could not find an open link name' };
}

export async function finishOnboarding(
  supabase: SupabaseClient,
  params: FinishOnboardingParams
): Promise<FinishOnboardingResult> {
  const gate = await requireV3Flow(supabase, params.profileId);
  if (!gate.ok) {
    return { success: false, error: gate.error, statusCode: gate.statusCode };
  }

  const { data: existingRows, error: existingError } = await supabase
    .from('business_profiles')
    .select('id, business_slug')
    .eq('profile_id', params.profileId)
    .order('created_at', { ascending: true })
    .limit(1);

  if (existingError) {
    return { success: false, error: existingError.message, statusCode: 500 };
  }

  const existing = existingRows?.[0];
  if (gate.status === 'completed') {
    const slug = existing?.business_slug?.trim();
    if (!slug) {
      return {
        success: false,
        error: 'Setup is already finished',
        statusCode: 400,
      };
    }
    return {
      success: true,
      slug,
      businessProfileId: existing?.id,
    };
  }

  const businessName = params.businessName.trim();
  if (!businessName) {
    return {
      success: false,
      error: 'Business name is required',
      statusCode: 400,
    };
  }

  const typeTrimmed = params.industry.trim();
  if (!typeTrimmed || !isAllowedBusinessTypeValue(typeTrimmed)) {
    return {
      success: false,
      error: 'Choose the kind of work you do',
      statusCode: 400,
    };
  }

  const specialties = sanitizeBusinessSpecialties(params.trades);
  if (specialties.length === 0) {
    return {
      success: false,
      error: 'Pick at least one trade',
      statusCode: 400,
    };
  }

  const phoneDigits = params.phoneDigits.replace(/\D/g, '');
  if (phoneDigits.length !== 0 && phoneDigits.length !== 10) {
    return {
      success: false,
      error: 'Enter a 10-digit phone number, or leave it blank',
      statusCode: 400,
    };
  }

  if (!existing?.id) {
    return {
      success: false,
      error: 'Choose the kind of work you do first',
      statusCode: 400,
    };
  }

  const businessProfileId = existing.id;
  const typeToStore = canonicalizeBusinessType(typeTrimmed) ?? typeTrimmed;

  const { error: updateError } = await supabase
    .from('business_profiles')
    .update({
      business_name: businessName,
      business_type: typeToStore,
      specialties,
      phone_number_call: phoneDigits.length === 10 ? phoneDigits : null,
      phone_number_text: null,
      updated_at: new Date().toISOString(),
      last_edited: new Date().toISOString(),
    } as never)
    .eq('id', businessProfileId);

  if (updateError) {
    return { success: false, error: updateError.message, statusCode: 500 };
  }

  let slug = existing.business_slug?.trim() || '';
  if (!slug) {
    const slugService = new SlugService(supabase as SupabaseClient<Database>);
    const claimed = await claimSlug(
      slugService,
      businessProfileId,
      params.slug.trim() || businessName
    );
    if (!claimed.slug) {
      return {
        success: false,
        error: claimed.error ?? 'Could not save your link',
        statusCode: 400,
      };
    }
    slug = claimed.slug;
  }

  const { count: serviceCount, error: countError } = await supabase
    .from('business_services')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessProfileId);

  if (countError) {
    return { success: false, error: countError.message, statusCode: 500 };
  }

  if ((serviceCount ?? 0) === 0) {
    const rows = specialties.slice(0, FREE_MAX_SERVICES).map(trade => {
      const sample = sampleServiceForTrade(trade);
      return {
        business_id: businessProfileId,
        name: sample.name,
        description: sample.description,
        price_cents: sample.priceCents,
        duration_minutes: sample.durationMinutes,
        is_active: true,
      };
    });

    const { error: insertError } = await supabase
      .from('business_services')
      .insert(rows as never);

    if (insertError) {
      return { success: false, error: insertError.message, statusCode: 500 };
    }
  }

  try {
    const availability = await getAvailabilityForBusiness(
      supabase,
      businessProfileId
    );
    if (!availability) {
      await upsertAvailabilityForBusiness(supabase, businessProfileId, {
        accept_bookings: true,
        minimum_notice: 'none',
        weekly_schedule: DEFAULT_SCHEDULE,
        selected_preset: 'mon_fri_9_5',
      });
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save hours',
      statusCode: 500,
    };
  }

  const completed = await completeOnboardingV2WithWelcomeLiveEmail(
    supabase,
    params.profileId,
    params.userEmail
  );
  if (!completed.success) {
    return {
      success: false,
      error: completed.error ?? 'Could not finish setup',
      statusCode: 500,
    };
  }

  return { success: true, slug, businessProfileId };
}
