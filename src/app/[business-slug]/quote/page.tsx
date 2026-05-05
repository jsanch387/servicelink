import { PublicQuoteRequestScreen } from '@/features/quotes/public-request/components/PublicQuoteRequestScreen';
import { publicQuoteRequestAllowedForSlug } from '@/features/quotes/public-request/server/publicQuoteRequestPageAllowed';
import {
  BOOKING_FLOW_LOCALE_COOKIE_NAME,
  resolveBookingFlowLocale,
} from '@/libs/bookingFlowLocale';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

interface PublicQuotePageProps {
  params: Promise<{ 'business-slug': string }>;
  searchParams?: Promise<{ lang?: string | string[] }>;
}

export default async function PublicQuotePage({
  params,
  searchParams,
}: PublicQuotePageProps) {
  const { 'business-slug': slug } = await params;
  const sp = (await searchParams) ?? {};
  const langParam = sp.lang;
  const langFromQuery =
    typeof langParam === 'string'
      ? langParam
      : Array.isArray(langParam)
        ? langParam[0]
        : undefined;
  const cookieStore = await cookies();
  const bookingFlowLocale = resolveBookingFlowLocale(
    langFromQuery,
    cookieStore.get(BOOKING_FLOW_LOCALE_COOKIE_NAME)?.value
  );
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const allowed = await publicQuoteRequestAllowedForSlug(supabase, admin, slug);
  if (!allowed.ok) {
    notFound();
  }

  const { data: profile } = await supabase
    .from('business_profiles')
    .select('business_name, business_type')
    .eq('business_slug', slug)
    .maybeSingle();

  if (!profile) notFound();

  const businessName = (
    profile as { business_name?: string }
  ).business_name?.trim();
  const businessType = (profile as { business_type?: string | null })
    .business_type;
  return (
    <PublicQuoteRequestScreen
      businessSlug={slug}
      businessName={businessName || 'this business'}
      businessType={businessType}
      bookingFlowLocale={bookingFlowLocale}
    />
  );
}
