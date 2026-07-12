'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BookFlowLoadingState } from './BookFlowLoadingState';

interface BookFlowClientRedirectProps {
  href: string;
}

/**
 * Client-side replace keeps the book layout Suspense boundary stable.
 * Server `redirect()` during route loading can trigger React 19 async cleanup warnings.
 */
export function BookFlowClientRedirect({ href }: BookFlowClientRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(href);
  }, [href, router]);

  return <BookFlowLoadingState />;
}
