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
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

interface PublicProfilePageProps {
  params: Promise<{
    'business-slug': string;
  }>;
}

async function fetchBusinessProfileBySlug(
  slug: string
): Promise<CompleteBusinessProfile | null> {
  console.log('🔍 [PublicProfile] Fetching profile for slug:', slug);

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

    // Get business profile by slug
    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('business_slug', slug)
      .single();

    if (profileError || !profile) {
      console.log(
        '❌ [PublicProfile] Profile not found for slug:',
        slug,
        profileError
      );
      return null;
    }

    console.log('✅ [PublicProfile] Found profile:', {
      id: profile.id,
      businessName: profile.business_name,
      slug: profile.business_slug,
    });

    // Get services
    const { data: services, error: servicesError } = await supabase
      .from('business_services')
      .select('*')
      .eq('business_id', profile.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (servicesError) {
      console.error(
        '❌ [PublicProfile] Error fetching services:',
        servicesError
      );
    } else {
      console.log('✅ [PublicProfile] Services fetched:', services);
    }

    // Get portfolio images
    const { data: images, error: imagesError } = await supabase
      .from('business_images')
      .select('*')
      .eq('business_id', profile.id)
      .order('position', { ascending: true });

    if (imagesError) {
      console.error('❌ [PublicProfile] Error fetching images:', imagesError);
    } else {
      console.log('✅ [PublicProfile] Images fetched:', images);
    }

    // Add preview URLs to images (same as BusinessProfileApi does)
    const imagesWithUrls = (images || []).map((img: any) => ({
      ...img,
      preview_url: MediaService.getPublicUrl(img.storage_path),
    }));

    // Add logo and banner URLs if they exist
    const logoUrl = profile.logo_path
      ? MediaService.getPublicUrl(profile.logo_path)
      : null;
    const bannerUrl = profile.banner_path
      ? MediaService.getPublicUrl(profile.banner_path)
      : null;

    // Construct complete business profile
    const completeProfile: CompleteBusinessProfile = {
      ...profile,
      services: services || [],
      images: imagesWithUrls || [],
      logo_url: logoUrl,
      cover_image_url: bannerUrl,
    };

    console.log('✅ [PublicProfile] Complete profile constructed:', {
      servicesCount: completeProfile.services.length,
      imagesCount: completeProfile.images.length,
      services: completeProfile.services,
      images: completeProfile.images,
    });

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

  console.log('🌐 [PublicProfile] Loading public profile for slug:', slug);

  // Fetch the business profile by slug
  const businessProfile = await fetchBusinessProfileBySlug(slug);

  // If profile not found, show 404
  if (!businessProfile) {
    console.log('❌ [PublicProfile] Profile not found, showing 404');
    notFound();
  }

  console.log(
    '✅ [PublicProfile] Rendering profile:',
    businessProfile.business_name
  );

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
      />
    </div>
  );
}

// Generate comprehensive metadata for SEO
export async function generateMetadata({ params }: PublicProfilePageProps) {
  const { 'business-slug': slug } = await params;

  try {
    const businessProfile = await fetchBusinessProfileBySlug(slug);

    if (!businessProfile) {
      return {
        title: 'Business Profile Not Found | ServiceLink',
        description: 'The requested business profile could not be found.',
        robots: 'noindex, nofollow',
      };
    }

    // Generate dynamic content for SEO
    const businessName = businessProfile.business_name;
    const businessType =
      businessProfile.business_type || 'Professional Services';
    const serviceArea = businessProfile.service_area || '';
    const bio =
      businessProfile.bio ||
      `Professional ${businessType.toLowerCase()} services`;
    const servicesCount = businessProfile.services?.length || 0;
    const imagesCount = businessProfile.images?.length || 0;

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
