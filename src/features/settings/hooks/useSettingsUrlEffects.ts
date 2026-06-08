'use client';

import { PRO_WELCOME_MODAL_SEEN_KEY } from '@/features/pricing/types';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useSettingsUrlEffects(checkoutSuccessProp = false) {
  const searchParams = useSearchParams();
  const [showProWelcomeModal, setShowProWelcomeModal] = useState(false);

  useEffect(() => {
    const fromUrl = searchParams.get('checkout') === 'success';
    const shouldShow = fromUrl || checkoutSuccessProp;
    if (!shouldShow) return;
    try {
      const seen = window.localStorage.getItem(PRO_WELCOME_MODAL_SEEN_KEY);
      if (!seen) setShowProWelcomeModal(true);
    } catch {
      // ignore
    }
  }, [searchParams, checkoutSuccessProp]);

  return {
    showProWelcomeModal,
    setShowProWelcomeModal,
  };
}
