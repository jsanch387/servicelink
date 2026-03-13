import { UpgradeContent } from '@/features/pricing';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Upgrade page – shows the one plan (Pro) to upgrade to.
 * Linked from Settings when user is on Free plan.
 */
export default async function DashboardUpgradePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  return <UpgradeContent />;
}
