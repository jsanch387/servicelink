/**
 * Onboarding State Helper Functions
 *
 * Handles getting and managing onboarding state
 */

import type { Database } from '@/libs/supabase/client';
import { createClient } from '@/libs/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_type?: string;
  service_area?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
  slug: string;
  phone_number_call: string | null;
  phone_number_text: string | null;
  [key: string]: unknown;
}

export interface OnboardingState {
  status: 'not_started' | 'in_progress' | 'completed';
  currentStep: number;
  userProfile: Record<string, unknown>;
  businessProfile: BusinessProfile | null;
  services: Record<string, unknown>[];
  images: Record<string, unknown>[];
  contactInfo: {
    phone_number_call: string | null;
    phone_number_text: string | null;
  };
}

function onboardingCentsToPrice(cents: number | null): string {
  if (cents === null) return '';
  return (cents / 100).toFixed(2);
}

type TypedClient = SupabaseClient<Database>;

/**
 * Gets complete onboarding state for a user
 * This is the single source of truth for onboarding status
 *
 * @param supabase Pass `createSupabaseServerClient()` from RSC / route handlers / server
 *   actions so RLS sees the user session. Omit only in browser/client code.
 */
export async function getOnboardingState(
  userId: string,
  supabase?: TypedClient
): Promise<{
  success: boolean;
  data?: OnboardingState;
  error?: string;
}> {
  try {
    const db = (supabase ?? createClient()) as TypedClient;

    // Avoid `.single()`: 0 rows or 2+ rows both yield PGRST116 ("Cannot coerce…").
    // Email confirmation signups may have no `profiles` row yet; duplicates should not break the app.
    const { data: profileRows, error: profileError } = await db
      .from('profiles')
      .select(
        'user_id, onboarding_status, onboarding_step, full_name, created_at, updated_at'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(2);

    if (profileError) {
      return {
        success: false,
        error: profileError.message,
      };
    }

    const rows = profileRows ?? [];

    let userProfile: Record<string, unknown>;
    if (rows.length > 0) {
      userProfile = rows[0] as unknown as Record<string, unknown>;
    } else {
      userProfile = {
        user_id: userId,
        onboarding_status: 'not_started',
        onboarding_step: 1,
        full_name: null,
        created_at: null,
        updated_at: null,
      };
    }

    // Prefer oldest business. Avoid bare `.maybeSingle()` — 2+ rows (duplicate
    // step-1 creates) yield PGRST116 and kick the user to /login mid-onboarding.
    const { data: businessRows, error: businessError } = await db
      .from('business_profiles')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (businessError) {
      return { success: false, error: businessError.message };
    }

    const businessProfile = businessRows?.[0]
      ? (businessRows[0] as unknown as BusinessProfile)
      : null;

    const status = (userProfile.onboarding_status as string) || 'not_started';
    const currentStep = Math.max(
      (userProfile.onboarding_step as number) || 1,
      1
    );

    let services: Record<string, unknown>[] = [];
    let images: Record<string, unknown>[] = [];
    let contactInfo = {
      phone_number_call: null as string | null,
      phone_number_text: null as string | null,
    };

    if (status !== 'completed' && businessProfile) {
      const businessId = businessProfile.id as string;

      const { data: serviceRows, error: servicesError } = await db
        .from('business_services')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (servicesError) {
        return { success: false, error: servicesError.message };
      }

      services = (serviceRows ?? []).map(row => {
        type Row = {
          id: string;
          name: string;
          description: string | null;
          price_cents: number | null;
          duration_minutes: number | null;
          hours_to_complete: number | null;
        };
        const r = row as Row;
        const hoursFromMinutes =
          r.duration_minutes != null ? r.duration_minutes / 60 : null;
        const hours = hoursFromMinutes ?? r.hours_to_complete ?? undefined;
        return {
          id: r.id,
          name: r.name,
          description: r.description || '',
          price: onboardingCentsToPrice(r.price_cents),
          hours_to_complete: hours,
        };
      });

      const { data: imageRows, error: imagesError } = await db
        .from('business_images')
        .select('*')
        .eq('business_id', businessId)
        .order('position', { ascending: true });

      if (imagesError) {
        return { success: false, error: imagesError.message };
      }

      images = (imageRows ?? []).map(row => {
        type Row = {
          id: string;
          storage_path: string;
          position: number;
        };
        const r = row as Row;
        return {
          id: r.id,
          storage_path: r.storage_path,
          position: r.position,
          preview_url: r.storage_path,
        };
      });

      contactInfo = {
        phone_number_call: businessProfile.phone_number_call as string | null,
        phone_number_text: businessProfile.phone_number_text as string | null,
      };
    }

    const state: OnboardingState = {
      status: status as OnboardingState['status'],
      currentStep,
      userProfile,
      businessProfile,
      services,
      images,
      contactInfo,
    };

    return { success: true, data: state };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get onboarding state',
    };
  }
}
