import { TeamDashboardPage } from '@/features/team';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';

export const dynamic = 'force-dynamic';

export default async function DashboardTeamPage() {
  await requireDashboardPageAccess('team.manage');
  return <TeamDashboardPage />;
}
