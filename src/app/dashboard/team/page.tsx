import { ROUTES } from '@/constants/routes';
import { TeamDashboardPage } from '@/features/team';
import { isOwnerEmailAllowedForTeamRollout } from '@/features/team/config/teamRolloutAllowlist';
import { loadBusinessTeamAccess } from '@/features/team/server/loadBusinessTeamAccess';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardTeamPage() {
  const sessionClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!isOwnerEmailAllowedForTeamRollout(user?.email)) {
    redirect(ROUTES.DASHBOARD.MAIN);
  }
  const { supabase, context } = await requireDashboardPageAccess('team.manage');
  const access = await loadBusinessTeamAccess(supabase, context.businessId);
  return <TeamDashboardPage canManageTeam={access.hasAccess} />;
}
