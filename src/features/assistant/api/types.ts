import type { AssistantTextUsage } from '../server/assistantUsageMonth';
import type { AssistantSendItemResult } from '../server/applyAssistantDecisions';
import type { AssistantToday } from '../today/buildAssistantToday';

export type AssistantTodayResponse =
  | {
      success: true;
      today: AssistantToday;
      usage: AssistantTextUsage;
    }
  | {
      success: false;
      error: string;
      code?: string;
    };

export type AssistantUsageResponse =
  | {
      success: true;
      usage: AssistantTextUsage;
    }
  | {
      success: false;
      error: string;
      code?: string;
    };

export type AssistantDecisionItemBody = {
  customerId: string;
  bookingId?: string | null;
  subject: 'review_followup' | 'rebook_checkin';
  body?: string;
};

export type AssistantDecisionResponse =
  | {
      success: true;
      recorded: number;
      usage: AssistantTextUsage;
      results?: AssistantSendItemResult[];
    }
  | {
      success: false;
      error: string;
      code?: 'limit_reached' | 'invalid_body' | string;
      usage?: AssistantTextUsage;
      results?: AssistantSendItemResult[];
    };
