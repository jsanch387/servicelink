import { ROUTES } from '@/constants/routes';
import { TeamDashboardPage } from '@/features/team';
import { isOwnerEmailAllowedForTeamRollout } from '@/features/team/config/teamRolloutAllowlist';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardTeamPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isOwnerEmailAllowedForTeamRollout(user?.email)) {
    redirect(ROUTES.DASHBOARD.MAIN);
  }
  await requireDashboardPageAccess('team.manage');
  return <TeamDashboardPage />;
}
