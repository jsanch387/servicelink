/**
 * Service Details page (add-ons step before calendar).
 * UI prototype: mock service + mock add-ons. Not connected to database.
 * Flow: Services list → Select → this page → Continue to Date & Time → calendar.
 */

import { ServiceDetailsScreen } from '@/features/services/booking-flow';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ServiceDetailsPageProps {
  params: Promise<{ 'business-slug': string }>;
  searchParams: Promise<{ serviceId?: string; addOnIds?: string }>;
}

export default async function ServiceDetailsPage({
  params,
  searchParams,
}: ServiceDetailsPageProps) {
  const { 'business-slug': slug } = await params;
  const { serviceId, addOnIds } = await searchParams;

  if (!serviceId?.trim()) {
    notFound();
  }

  const initialAddOnIds = addOnIds?.trim()
    ? addOnIds

        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    : undefined;

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <div className="sticky top-0 z-10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <Link
            href={`/${slug}`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Back to profile</span>
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-16 sm:pb-24">
        <ServiceDetailsScreen
          businessSlug={slug}
          serviceId={serviceId.trim()}
          initialAddOnIds={initialAddOnIds}
        />
      </div>
    </div>
  );
}
