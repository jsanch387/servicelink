/**
 * Onboarding V2 – local flow state (UI only, no API yet).
 */

import type { PresetKey } from '@/features/availability/components/QuickPresetsSection';
import type { WeeklySchedule } from '@/features/availability/types/availability';

export interface OnboardingV2Service {
  id: string;
  name: string;
  price: string;
  /** Duration in minutes (for booking). Stored in DB as duration_minutes. */
  durationMinutes: number;
  /** Service description (required). Same max length as dashboard service editor. */
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
