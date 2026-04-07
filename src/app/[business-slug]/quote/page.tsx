import { PublicQuoteRequestScreen } from '@/features/quotes/public-request/components/PublicQuoteRequestScreen';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { notFound } from 'next/navigation';

interface PublicQuotePageProps {
  params: Promise<{ 'business-slug': string }>;
}

export default async function PublicQuotePage({
  params,
}: PublicQuotePageProps) {
  const { 'business-slug': slug } = await params;
  const supabase = await createSupabaseServerClient();
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
    />
  );
}
