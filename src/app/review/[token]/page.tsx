import { PublicReviewErrorCard } from '@/features/reviews/public/components/PublicReviewErrorCard';
import { PublicReviewPageLayout } from '@/features/reviews/public/components/PublicReviewPageLayout';
import { PublicReviewPageShell } from '@/features/reviews/public/components/PublicReviewPageShell';
import { loadPublicReviewInviteByToken } from '@/features/reviews/server/loadPublicReviewInviteByToken';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { notFound } from 'next/navigation';

interface PublicReviewPageProps {
  params: Promise<{ token: string }>;
}

function formatVisitLine(scheduledDate: string, startTime: string): string {
  const d = new Date(`${scheduledDate}T12:00:00`);
  const dateLabel = Number.isNaN(d.getTime())
    ? scheduledDate
    : d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
  const trimmed = startTime.trim().slice(0, 5);
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return dateLabel;
  const hour = parseInt(match[1], 10);
  const min = match[2];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${dateLabel} · ${h12}:${min} ${ampm}`;
}

export default async function PublicReviewPage({
  params,
}: PublicReviewPageProps) {
  const { token } = await params;
  const raw = decodeURIComponent(token ?? '').trim();
  if (!raw) {
    notFound();
  }

  if (raw === 'mock') {
    notFound();
  }

  const admin = createSupabaseAdminClient();
  const loaded = await loadPublicReviewInviteByToken(admin, raw);

  if (!loaded.ok) {
    return (
      <PublicReviewPageLayout hideHeader centerContent>
        <PublicReviewErrorCard reason={loaded.reason} />
      </PublicReviewPageLayout>
    );
  }

  const { context } = loaded;
  const visitLine = formatVisitLine(
    context.scheduledDate,
    context.scheduledStartTime
  );
  const customerGreetingName =
    context.customerDisplayName.split(/\s+/)[0] ?? 'there';

  return (
    <PublicReviewPageShell
      token={raw}
      businessName={context.businessName}
      serviceName={context.serviceName}
      visitLine={visitLine}
      customerGreetingName={customerGreetingName}
    />
  );
}
