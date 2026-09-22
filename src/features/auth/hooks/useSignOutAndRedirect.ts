'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

/** Sign out and send the user to the public home page. */
export function useSignOutAndRedirect() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const signOutAndRedirect = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await signOut();
      if (result.success) router.push('/');
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [loading, signOut, router]);

  return { signOutAndRedirect, loading };
}
