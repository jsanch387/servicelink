/**
 * Not Found Page for Invalid Business Slugs
 *
 * Shows when someone visits a non-existent business profile URL
 */

import { Button } from '@/components/shared';
import { HomeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center px-4">
      <div className="max-w-md mx-auto text-center">
        {/* Icon */}
        <div className="mb-8">
          <MagnifyingGlassIcon className="h-24 w-24 text-gray-400 mx-auto" />
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold text-white mb-4">
          Business Not Found
        </h1>

        <p className="text-gray-400 text-lg mb-8">
          Sorry, we couldn&apos;t find the business profile you&apos;re looking
          for. The link might be incorrect or the business may have changed
          their profile.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link href="/" className="block">
            <Button
              variant="inverse"
              fullWidth
              icon={<HomeIcon className="h-5 w-5" />}
            >
              Go to Homepage
            </Button>
          </Link>

          <p className="text-gray-500 text-sm">
            Think this is a mistake? Check the URL and try again.
          </p>
        </div>
      </div>
    </div>
  );
}
