import { getBusinessBookPath } from '@/constants/routes';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export type GetBookingLinkResult =
  | {
      ok: true;
      bookingUrl: string;
      businessName: string | null;
      slug: string | null;
    }
  | { ok: false; error: string };

export async function executeGetBookingLink(args: {
  businessId: string;
}): Promise<GetBookingLinkResult> {
  try {
    const admin = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('business_profiles')
      .select('business_name, business_slug, business_link')
      .eq('id', args.businessId)
      .maybeSingle();

    if (error) {
      console.error('[assistant:chat] getBookingLink', error);
      return {
        ok: false,
        error: 'Could not load your booking link right now.',
      };
    }

    const profile = data as {
      business_name: string | null;
      business_slug: string | null;
      business_link: string | null;
    } | null;

    const link = profile?.business_link?.trim();
    const slug = profile?.business_slug?.trim() || null;
    let bookingUrl = '';
    if (link) {
      bookingUrl = /^https?:\/\//i.test(link) ? link : `https://${link}`;
    } else if (slug) {
      const base = (
        process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app'
      ).replace(/\/$/, '');
      bookingUrl = `${base}${getBusinessBookPath(slug)}`;
    }

    if (!bookingUrl) {
      return {
        ok: false,
        error:
          'No booking link is set up yet. Add a slug on your booking link page.',
      };
    }

    return {
      ok: true,
      bookingUrl,
      businessName: profile?.business_name?.trim() || null,
      slug,
    };
  } catch (error) {
    console.error('[assistant:chat] getBookingLink', error);
    return { ok: false, error: 'Could not load your booking link right now.' };
  }
}
