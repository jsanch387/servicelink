import { TeamInviteAcceptScreen } from '@/features/team/components/TeamInviteAcceptScreen';
import { loadTeamInviteByToken } from '@/features/team/server/loadTeamInviteByToken';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Team invite - ServiceLink',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function TeamInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const raw = decodeURIComponent(token ?? '').trim();
  if (!raw) notFound();

  const loaded = await loadTeamInviteByToken(
    createSupabaseAdminClient(),
    raw
  );

  if (!loaded.ok) {
    const message =
      loaded.reason === 'expired'
        ? 'This invite has expired. Ask the owner to send a new one.'
        : loaded.reason === 'used'
          ? 'This invite was already used.'
          : 'This invite is invalid or expired.';
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--dashboard-bg,#0a0a0a)] px-4">
        <p className="max-w-sm text-center text-sm leading-relaxed text-zinc-400">
          {message}
        </p>
      </main>
    );
  }

  return (
    <TeamInviteAcceptScreen
      token={raw}
      email={loaded.invite.email}
      businessName={loaded.businessName}
    />
  );
}
