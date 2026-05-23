'use client';

import { API_ROUTES } from '@/constants/routes';

import type { WorkshopFunnelEvent } from '../types/workshopLead';
import { getWorkshopLeadId } from './workshopLeadSession';
import { getStoredWorkshopUtms } from './workshopUtmCapture';

export async function trackWorkshopLeadInSupabase(
  event: WorkshopFunnelEvent
): Promise<void> {
  const leadId = getWorkshopLeadId();
  if (!leadId) return;

  try {
    await fetch(API_ROUTES.WORKSHOP_TRACK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, event }),
      keepalive: true,
    });
  } catch {
    // Best-effort funnel tracking
  }
}

export type RegisterWorkshopLeadPayload = {
  email: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  landingPath?: string;
};

export function buildWorkshopRegisterPayload(
  email: string
): RegisterWorkshopLeadPayload {
  const utms = getStoredWorkshopUtms();
  return {
    email: email.trim(),
    ...utms,
  };
}

export async function recordWorkshopSignupConversion(options: {
  email?: string;
  userId?: string;
}): Promise<void> {
  const leadId = getWorkshopLeadId();
  const email = options.email?.trim();

  if (!leadId && !email) return;

  try {
    await fetch(API_ROUTES.WORKSHOP_CONVERTED, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        userId: options.userId,
        leadId: leadId ?? undefined,
      }),
      keepalive: true,
    });
  } catch {
    // Best-effort
  }
}
