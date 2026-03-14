/**
 * Public Business Profile Page
 *
 * Handles URLs like: myservicelink.app/johns-plumbing
 * Fetches business profile by slug and displays it publicly
 */

import { StructuredData } from '@/components/shared';
import { ViewTracker } from '@/features/analytics';
import { BusinessProfileView } from '@/features/business-profile/components/BusinessProfileView';
import { CompleteBusinessProfile } from '@/features/business-profile/types/businessProfile';
import { MediaService } from '@/features/media';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { notFound } from 'next/navigation';

// Enable static generation with revalidation for better performance
export const revalidate = 60; // Revalidate every 60 seconds

interface PublicProfilePageProps {
  params: Promise<{
    'business-slug': string;
  }>;
}

type PublicBusinessProfileRow = {
  id: string;
  business_name: string;
  business_type: string | null;
  service_area: string | null;
  bio: string | null;
  logo_path: string | null;
  banner_path: string | null;
  phone_number_call?: string | null;
  [key: string]: unknown;
};

async function fetchBusinessProfileBySlug(
  slug: string
): Promise<CompleteBusinessProfile | null> {
  try {
    const supabase = await createSupabaseServerClient();

    // Get business profile by slug
    const { data: profileData, error: profileError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('business_slug', slug)
      .single();

    if (profileError || !profileData) {
      return null;
    }

    const profile = profileData as PublicBusinessProfileRow;

    // Fetch services and images in parallel for better performance
    const [servicesResult, imagesResult] = await Promise.all([
      supabase
        .from('business_services')
        .select('*')
        .eq('business_id', profile.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true }),
      supabase
        .from('business_images')
        .select('*')
        .eq('business_id', profile.id)
        .order('position', { ascending: true }),
    ]);

    const services = servicesResult.data || [];
    const images = imagesResult.data || [];

    // Add preview URLs to images
    const imagesWithUrls = images.map(img => ({
      ...(img as {
        id: string;
        business_id: string;
        storage_path: string;
        position: number;
        created_at: string;
      }),
      preview_url: MediaService.getPublicUrl(
        (img as { storage_path: string }).storage_path
      ),
    }));

    // Add logo and banner URLs if they exist
    const logoUrl = profile.logo_path
      ? MediaService.getPublicUrl(profile.logo_path)
      : null;
    const bannerUrl = profile.banner_path
      ? MediaService.getPublicUrl(profile.banner_path)
      : null;

    // Construct complete business profile
    const completeProfile = {
      ...profile,
      services,
      images: imagesWithUrls,
      logo_url: logoUrl,
      cover_image_url: bannerUrl,
    } as unknown as CompleteBusinessProfile;

    return completeProfile;
  } catch (error) {
    console.error('❌ [PublicProfile] Error fetching profile:', error);
    return null;
  }
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { 'business-slug': slug } = await params;

  // Fetch the business profile by slug
  const businessProfile = await fetchBusinessProfileBySlug(slug);

  // If profile not found, show 404
  if (!businessProfile) {
    notFound();
  }

  // Derive verified badge from owner's subscription (Pro = verified); single source of truth is profiles.subscription_tier
  const profileId = (businessProfile as { profile_id?: string }).profile_id;
  let showVerifiedBadge = false;
  if (profileId) {
    const admin = createSupabaseAdminClient();
    const { data: ownerProfile } = await admin
      .from('profiles')
      .select('subscription_tier')
      .eq('user_id', profileId)
      .maybeSingle();
    const tier = (ownerProfile as { subscription_tier?: string } | null)
      ?.subscription_tier;
    showVerifiedBadge = tier === 'pro';
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* View Tracking */}
      <ViewTracker businessSlug={slug} />

      {/* Structured Data for SEO */}
      <StructuredData businessProfile={businessProfile} slug={slug} />

      <BusinessProfileView
        businessProfile={businessProfile}
        initialMode="view"
        isPublic={true}
        showVerifiedBadge={showVerifiedBadge}
      />
    </div>
  );
}

// Generate comprehensive metadata for SEO
export async function generateMetadata({ params }: PublicProfilePageProps) {
  const { 'business-slug': slug } = await params;

  try {
    // Use a lightweight fetch for metadata (only get what we need)
    const supabase = await createSupabaseServerClient();

    const { data: profileData } = await supabase
      .from('business_profiles')
      .select(
        'business_name, business_type, service_area, bio, logo_path, banner_path, phone_number_call'
      )
      .eq('business_slug', slug)
      .single();

    if (!profileData) {
      return {
        title: 'Business Profile Not Found | ServiceLink',
        description: 'The requested business profile could not be found.',
        robots: 'noindex, nofollow',
      };
    }

    const profile = profileData as PublicBusinessProfileRow;

    const businessProfile = {
      business_name: profile.business_name,
      business_type: profile.business_type,
      service_area: profile.service_area,
      bio: profile.bio,
      logo_url: profile.logo_path
        ? MediaService.getPublicUrl(profile.logo_path)
        : null,
      cover_image_url: profile.banner_path
        ? MediaService.getPublicUrl(profile.banner_path)
        : null,
      phone_number_call: profile.phone_number_call,
    };

    // Generate dynamic content for SEO
    const businessName = businessProfile.business_name;
    const businessType =
      businessProfile.business_type || 'Professional Services';
    const serviceArea = businessProfile.service_area || '';
    const bio =
      businessProfile.bio ||
      `Professional ${businessType.toLowerCase()} services`;
    // Services and images count for metadata generation (for future use)
    // const _servicesCount = businessProfile.services?.length || 0;
    // const _imagesCount = businessProfile.images?.length || 0;

    // Create dynamic title and description
    const title = serviceArea
      ? `${businessName} - ${businessType} in ${serviceArea} | ServiceLink`
      : `${businessName} - ${businessType} | ServiceLink`;

    const description = bio.length > 160 ? `${bio.substring(0, 157)}...` : bio;

    // Generate keywords based on business data
    const keywords = [
      businessName,
      businessType,
      serviceArea,
      'professional services',
      'business profile',
      'contact directly',
      'ServiceLink',
    ]
      .filter(Boolean)
      .join(', ');

    // Generate canonical URL
    const canonicalUrl = `https://myservicelink.app/${slug}`;

    return {
      title,
      description,
      keywords,
      canonical: canonicalUrl,
      robots: 'index, follow',
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'ServiceLink',
        locale: 'en_US',
        type: 'website',
        images: [
          {
            url:
              businessProfile.cover_image_url ||
              businessProfile.logo_url ||
              '/service-link-logo.png',
            width: 1200,
            height: 630,
            alt: `${businessName} - ${businessType}`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [
          businessProfile.cover_image_url ||
            businessProfile.logo_url ||
            '/service-link-logo.png',
        ],
        site: '@servicelink',
        creator: '@servicelink',
      },
      alternates: {
        canonical: canonicalUrl,
      },
      other: {
        'business:contact_data:locality': serviceArea.split(',')[0] || '',
        'business:contact_data:region': serviceArea.split(',')[1]?.trim() || '',
        'business:contact_data:country_name': 'United States',
        'og:business:contact_data:phone_number':
          businessProfile.phone_number_call || '',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Business Profile | ServiceLink',
      description: 'Professional business profile on ServiceLink',
      robots: 'noindex, nofollow',
    };
  }
}
