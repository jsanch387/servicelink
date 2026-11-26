import { Button } from '@/components/shared';
import { HomeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900 px-4">
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
          404
        </p>
        <h1 className="mt-3 text-4xl font-bold text-white">Page not found</h1>
        <p className="mt-4 text-lg text-gray-400">
          That link doesn&apos;t go anywhere. Check the URL, or head back to
          ServiceLink.
        </p>
        <div className="mt-8">
          <Link href="/" className="block">
            <Button
              variant="inverse"
              fullWidth
              icon={<HomeIcon className="h-5 w-5" />}
            >
              Go to homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
