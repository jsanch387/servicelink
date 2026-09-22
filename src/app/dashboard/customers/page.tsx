import { CustomerManagementPage } from '@/features/customer-management';
import { ownerHasProAccessForBusiness } from '@/features/pricing/server/ownerHasProAccessForBusiness';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const { supabase, context } =
    await requireDashboardPageAccess('customers.read');

  const hasProCheckInAccess = await ownerHasProAccessForBusiness(
    supabase,
    context.businessId
  );

  return <CustomerManagementPage hasProCheckInAccess={hasProCheckInAccess} />;
}
