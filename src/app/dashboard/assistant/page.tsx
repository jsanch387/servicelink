import { AssistantPage } from '@/features/assistant';
import { emptyAssistantToday } from '@/features/assistant/today/buildAssistantToday';
import { loadAssistantToday } from '@/features/assistant/today/loadAssistantToday';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';

export const dynamic = 'force-dynamic';

export default async function DashboardAssistantPage() {
  const { supabase, context } =
    await requireDashboardPageAccess('customers.read');

  let today = emptyAssistantToday();
  try {
    today = await loadAssistantToday(supabase, context.businessId);
  } catch (error) {
    console.error('[assistant] today load failed', error);
  }

  return <AssistantPage today={today} />;
}
