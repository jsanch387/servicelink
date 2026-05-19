'use client';

import { persistSignupAttributionToProfile } from '@/features/analytics/signupAttribution';
import { useEffect } from 'react';

/** Saves stored first-touch attribution to the signed-in profile (once). */
export function PersistSignupAttribution() {
  useEffect(() => {
    void persistSignupAttributionToProfile();
  }, []);

  return null;
}
