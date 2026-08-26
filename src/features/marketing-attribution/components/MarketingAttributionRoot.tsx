'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { trackAffonsoSignupOnce } from '../utils/affonsoSignupTracking';
import { tryRecordSignupAttribution } from '../utils/attributionApi';
import { captureMarketingUtmsFromSearchParams } from '../utils/utmCapture';

/**
 * Root client tracker: first-touch UTMs + signup attribution sync.
 */
export function MarketingAttributionRoot() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { supabaseUser, isInitialized, isLoading } = useAuth();

  useEffect(() => {
    if (!pathname) return;
    captureMarketingUtmsFromSearchParams(searchParams, pathname);
  }, [searchParams, pathname]);

  useEffect(() => {
    if (!isInitialized || isLoading || !supabaseUser?.id) return;
    void tryRecordSignupAttribution(supabaseUser.id);
    void trackAffonsoSignupOnce({
      email: supabaseUser.email,
      externalUserId: supabaseUser.id,
    });
  }, [isInitialized, isLoading, supabaseUser?.id, supabaseUser?.email]);

  return null;
}
