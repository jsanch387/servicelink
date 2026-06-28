'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { tryRecordSignupAttribution } from '../utils/attributionApi';
import { captureMarketingUtmsFromSearchParams } from '../utils/utmCapture';

/**
 * Root client tracker: first-touch UTMs + signup attribution sync.
 */
export function MarketingAttributionRoot() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isInitialized, isLoading } = useAuth();

  useEffect(() => {
    if (!pathname) return;
    captureMarketingUtmsFromSearchParams(searchParams, pathname);
  }, [searchParams, pathname]);

  useEffect(() => {
    if (!isInitialized || isLoading || !user?.id) return;
    void tryRecordSignupAttribution(user.id);
  }, [isInitialized, isLoading, user?.id]);

  return null;
}
