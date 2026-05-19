'use client';

import { ensureSignupAttributionCaptured } from '@/features/analytics/signupAttribution';
import { useEffect } from 'react';

/** Captures first-touch UTM/referrer on any marketing visit (before signup). */
export function SignupAttributionCapture() {
  useEffect(() => {
    ensureSignupAttributionCaptured();
  }, []);

  return null;
}
