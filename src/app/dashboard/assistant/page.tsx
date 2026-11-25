import { AssistantPage } from '@/features/assistant';
import {
  ASSISTANT_BETA_CHAT_TURN_LIMIT,
  ASSISTANT_BETA_TEXT_LIMIT,
} from '@/features/assistant/constants/assistantBetaLimits';
import {
  assistantYearMonthUtc,
  getAssistantChatUsage,
  getAssistantTextUsage,
  type AssistantChatUsage,
  type AssistantTextUsage,
} from '@/features/assistant/server/assistantUsageMonth';
import { businessCanUseAssistant } from '@/features/assistant/server/requireAssistantPro';
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

function emptyChatUsage(): AssistantChatUsage {
  return {
    yearMonth: assistantYearMonthUtc(),
    used: 0,
    limit: ASSISTANT_BETA_CHAT_TURN_LIMIT,
    remaining: ASSISTANT_BETA_CHAT_TURN_LIMIT,
  };
}

export default async function DashboardAssistantPage() {
  const { supabase, context } =
    await requireDashboardPageAccess('customers.read');

  let today = emptyAssistantToday();
  let usage = emptyUsage();
  let chatUsage = emptyChatUsage();
  let isPro = false;

  try {
    const admin = createSupabaseAdminClient();
    const [loadedToday, loadedUsage, loadedChatUsage, canUse] =
      await Promise.all([
        loadAssistantToday(supabase, context.businessId),
        getAssistantTextUsage(admin, context.businessId),
        getAssistantChatUsage(admin, context.businessId),
        businessCanUseAssistant(context.businessId),
      ]);
    today = loadedToday;
    usage = loadedUsage;
    chatUsage = loadedChatUsage;
    isPro = canUse;
  } catch (error) {
    console.error('[assistant] today load failed', error);
  }

  return (
    <AssistantPage
      today={today}
      usage={usage}
      chatUsage={chatUsage}
      isPro={isPro}
    />
  );
}
