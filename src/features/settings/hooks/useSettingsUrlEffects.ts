'use client';

import { trackMetaSubscribeOnce } from '@/features/analytics/utils/metaSubscribeTracking';
import { useAuth } from '@/features/auth';
import { PRO_WELCOME_MODAL_SEEN_KEY } from '@/features/pricing/types';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useSettingsUrlEffects(checkoutSuccessProp = false) {
  const searchParams = useSearchParams();
  const { supabaseUser } = useAuth();
  const [showProWelcomeModal, setShowProWelcomeModal] = useState(false);

  useEffect(() => {
    const fromUrl = searchParams.get('checkout') === 'success';
    const shouldShow = fromUrl || checkoutSuccessProp;
    if (!shouldShow) return;
    try {
      if (supabaseUser?.id) {
        trackMetaSubscribeOnce(supabaseUser.id);
      }
      const seen = window.localStorage.getItem(PRO_WELCOME_MODAL_SEEN_KEY);
      if (!seen) setShowProWelcomeModal(true);
    } catch {
      // ignore
    }
  }, [searchParams, checkoutSuccessProp, supabaseUser?.id]);

  return {
    showProWelcomeModal,
    setShowProWelcomeModal,
  };
}
