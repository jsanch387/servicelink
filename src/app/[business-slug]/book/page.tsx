/**
 * Booking Request Page
 *
 * Handles URLs like: myservicelink.app/johns-plumbing/book
 * Displays the booking request form for a specific business
 */

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AVAILABILITY_BOOKING_ENABLED } from '@/features/availability/constants';
import { BookFlowSwitch } from './BookFlowSwitch';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface BookingRequestPageProps {
  params: Promise<{
    'business-slug': string;
  }>;
  searchParams: Promise<{
    serviceId?: string;
  }>;
}

async function fetchBusinessProfileBySlug(slug: string) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: profile, error } = await supabase
      .from('business_profiles')
      .select('id, business_name, business_slug')
      .eq('business_slug', slug)
      .single();

    if (error || !profile) {
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error fetching business profile:', error);
    return null;
  }
}

async function fetchServiceById(
  businessId: string,
  serviceId: string
): Promise<{ name: string; price: number } | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: service, error } = await supabase
      .from('business_services')
      .select('name, price_cents')
      .eq('id', serviceId)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .single();

    if (error || !service) {
      return null;
    }

    return {
      name: service.name,
      price: service.price_cents || 0,
    };
  } catch (error) {
    console.error('Error fetching service by id:', error);
    return null;
  }
}

export default async function BookingRequestPage({
  params,
  searchParams,
}: BookingRequestPageProps) {
  const { 'business-slug': slug } = await params;
  const { serviceId } = await searchParams;

  // Fetch the business profile by slug
  const businessProfile = await fetchBusinessProfileBySlug(slug);

  // If profile not found, show 404
  if (!businessProfile) {
    notFound();
  }

  // Fetch service by ID when present (validates business_id)
  const serviceDetails =
    serviceId && serviceId.trim()
      ? await fetchServiceById(businessProfile.id, serviceId.trim())
      : null;
  const serviceName = serviceDetails?.name ?? '';

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800">
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

      {/* Form Container – availability booking or request booking by flag */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-16 sm:pt-8 sm:pb-24">
        <BookFlowSwitch
          useAvailabilityBooking={AVAILABILITY_BOOKING_ENABLED}
          businessName={businessProfile.business_name}
          businessId={businessProfile.id}
          businessSlug={businessProfile.business_slug || slug}
          serviceName={serviceName}
          servicePrice={serviceDetails?.price ?? undefined}
        />
      </div>
    </div>
  );
}
