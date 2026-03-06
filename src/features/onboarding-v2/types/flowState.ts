/**
 * Onboarding V2 – local flow state (UI only, no API yet).
 */

import type { WeeklySchedule } from '@/features/availability/types/availability';
import type { PresetKey } from '@/features/availability/components/QuickPresetsSection';

export interface OnboardingV2Service {
  id: string;
  name: string;
  price: string;
  /** Duration in minutes (for booking). Stored in DB as duration_minutes. */
  durationMinutes: number;
  /** Short description of what's included (required). Max 250 chars for card display. */
  description?: string;
}

export interface OnboardingV2FlowState {
  businessName: string;
  businessType: string;
  services: OnboardingV2Service[];
  schedule: WeeklySchedule;
  selectedPreset: PresetKey | null;
  slug: string;
}
