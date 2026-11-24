import { AssistantPage } from '@/features/assistant';
import { ASSISTANT_BETA_TEXT_LIMIT } from '@/features/assistant/constants/assistantBetaLimits';
import {
  assistantYearMonthUtc,
  getAssistantTextUsage,
  type AssistantTextUsage,
} from '@/features/assistant/server/assistantUsageMonth';
import { emptyAssistantToday } from '@/features/assistant/today/buildAssistantToday';
import { loadAssistantToday } from '@/features/assistant/today/loadAssistantToday';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export const dynamic = 'force-dynamic';

function emptyUsage(): AssistantTextUsage {
  return {
    yearMonth: assistantYearMonthUtc(),
    sent: 0,
    limit: ASSISTANT_BETA_TEXT_LIMIT,
    remaining: ASSISTANT_BETA_TEXT_LIMIT,
  };
}

export default async function DashboardAssistantPage() {
  const { supabase, context } =
    await requireDashboardPageAccess('customers.read');

  let today = emptyAssistantToday();
  let usage = emptyUsage();

  try {
    const admin = createSupabaseAdminClient();
    const [loadedToday, loadedUsage] = await Promise.all([
      loadAssistantToday(supabase, context.businessId),
      getAssistantTextUsage(admin, context.businessId),
    ]);
    today = loadedToday;
    usage = loadedUsage;
  } catch (error) {
    console.error('[assistant] today load failed', error);
  }

  return <AssistantPage today={today} usage={usage} />;
}
