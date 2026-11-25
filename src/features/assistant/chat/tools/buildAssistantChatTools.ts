import { executeGetBookingLink } from '@/features/assistant/chat/tools/read/getBookingLink';
import {
  DUE_FOLLOW_UP_KINDS,
  executeGetDueFollowUps,
} from '@/features/assistant/chat/tools/read/getDueFollowUps';
import {
  executeGetExpenses,
  GET_EXPENSE_PERIODS,
} from '@/features/assistant/chat/tools/read/getExpenses';
import {
  executeGetJobsSummary,
  JOBS_SUMMARY_RANGES,
} from '@/features/assistant/chat/tools/read/getJobsSummary';
import {
  executeGetRecentJobs,
  RECENT_JOB_STATUSES,
} from '@/features/assistant/chat/tools/read/getRecentJobs';
import {
  executeGetRevenue,
  GET_REVENUE_PERIODS,
} from '@/features/assistant/chat/tools/read/getRevenue';
import { executeGetServiceMenu } from '@/features/assistant/chat/tools/read/getServiceMenu';
import {
  executeGetTopCustomers,
  TOP_CUSTOMER_PERIODS,
} from '@/features/assistant/chat/tools/read/getTopCustomers';
import { executeGetUnpaidInvoices } from '@/features/assistant/chat/tools/read/getUnpaidInvoices';
import { executeFindCustomer } from '@/features/assistant/chat/tools/read/findCustomer';
import {
  CHAT_GAP_REASONS,
  executeRecordChatGap,
} from '@/features/assistant/chat/tools/read/recordChatGap';
import { tool } from 'ai';
import { z } from 'zod';

/** Read-only tools for Ask-anything. `businessId` is injected — never from the model. */
export function buildAssistantChatTools(args: { businessId: string }) {
  const { businessId } = args;

  return {
    getRevenue: tool({
      description:
        'Get shop revenue (collected from completed jobs) for a period, including top services. Use for earnings and top services.',
      inputSchema: z.object({
        period: z
          .enum(GET_REVENUE_PERIODS)
          .describe(
            'week = this week, month = this calendar month, last_month = previous calendar month, year = this year, all = all time'
          ),
      }),
      execute: async ({ period }) =>
        executeGetRevenue({ businessId, period }),
    }),
    getServiceMenu: tool({
      description:
        'Get the active service menu (names, descriptions, prices, durations, categories, options, add-ons). Use for menu feedback and booking-page clarity.',
      inputSchema: z.object({}),
      execute: async () => executeGetServiceMenu({ businessId }),
    }),
    getJobsSummary: tool({
      description:
        'Get schedule summary for today or this week: counts and upcoming confirmed jobs.',
      inputSchema: z.object({
        range: z
          .enum(JOBS_SUMMARY_RANGES)
          .describe('today or week (Mon–Sun containing today)'),
      }),
      execute: async ({ range }) =>
        executeGetJobsSummary({ businessId, range }),
    }),
    getRecentJobs: tool({
      description:
        'List recent jobs (default completed). Use for last job, whether they left a review, or finished work.',
      inputSchema: z.object({
        status: z.enum(RECENT_JOB_STATUSES).optional(),
        limit: z.number().int().min(1).max(10).optional(),
        customerQuery: z.string().max(80).optional(),
      }),
      execute: async ({ status, limit, customerQuery }) =>
        executeGetRecentJobs({
          businessId,
          status,
          limit,
          customerQuery,
        }),
    }),
    getDueFollowUps: tool({
      description:
        'Who needs a review follow-up or rebook check-in (same rules as morning Assistant).',
      inputSchema: z.object({
        kind: z.enum(DUE_FOLLOW_UP_KINDS).optional(),
      }),
      execute: async ({ kind }) =>
        executeGetDueFollowUps({ businessId, kind }),
    }),
    findCustomer: tool({
      description:
        'Find a customer by name, phone, or email. Returns last visit, spend, review, upcoming booking.',
      inputSchema: z.object({
        query: z.string().min(1).max(80),
        limit: z.number().int().min(1).max(10).optional(),
      }),
      execute: async ({ query, limit }) =>
        executeFindCustomer({ businessId, query, limit }),
    }),
    getTopCustomers: tool({
      description:
        'Rank top customers by completed-job spend for a period (month, year, or all time).',
      inputSchema: z.object({
        limit: z.number().int().min(1).max(10).optional(),
        period: z.enum(TOP_CUSTOMER_PERIODS).optional(),
      }),
      execute: async ({ limit, period }) =>
        executeGetTopCustomers({ businessId, limit, period }),
    }),
    getExpenses: tool({
      description:
        'Get expense totals for a period, including by category. Pro feature.',
      inputSchema: z.object({
        period: z.enum(GET_EXPENSE_PERIODS),
      }),
      execute: async ({ period }) =>
        executeGetExpenses({ businessId, period }),
    }),
    getUnpaidInvoices: tool({
      description:
        'List unpaid (sent) invoices and outstanding total. Pro feature.',
      inputSchema: z.object({
        limit: z.number().int().min(1).max(10).optional(),
      }),
      execute: async ({ limit }) =>
        executeGetUnpaidInvoices({ businessId, limit }),
    }),
    getBookingLink: tool({
      description: 'Get the shop public booking link URL.',
      inputSchema: z.object({}),
      execute: async () => executeGetBookingLink({ businessId }),
    }),
    recordChatGap: tool({
      description:
        'Record that you could not answer with available tools. Call once before the honest redirect. Not chat history.',
      inputSchema: z.object({
        questionExcerpt: z.string().max(500),
        reason: z.enum(CHAT_GAP_REASONS),
        topicHint: z.string().max(80).optional(),
      }),
      execute: async ({ questionExcerpt, reason, topicHint }) =>
        executeRecordChatGap({
          businessId,
          questionExcerpt,
          reason,
          topicHint,
        }),
    }),
  };
}
