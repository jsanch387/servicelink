import Link from 'next/link';
import { Button } from '@/components/shared';

export default function BookingNotFound() {
  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-white mb-4">
          Booking Page Not Found
        </h1>
        <p className="text-gray-400 mb-8">
          The business profile you&apos;re looking for doesn&apos;t exist or has
          been removed.
        </p>
        <Link href="/">
          <Button variant="primary">Go to Homepage</Button>
        </Link>
      </div>
    </div>
  );
}
