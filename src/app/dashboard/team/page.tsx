import { ROUTES } from '@/constants/routes';
import { redirect } from 'next/navigation';

export default function DashboardTeamPage() {
  redirect(`${ROUTES.DASHBOARD.SETTINGS}?tab=team`);
}
