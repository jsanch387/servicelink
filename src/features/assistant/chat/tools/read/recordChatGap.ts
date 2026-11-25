import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export const CHAT_GAP_REASONS = [
  'no_tool',
  'empty_result',
  'error',
  'thumbs_down',
] as const;

export type ChatGapReason = (typeof CHAT_GAP_REASONS)[number];

const MAX_EXCERPT = 500;
const MAX_TOPIC = 80;

export type RecordChatGapResult =
  | { ok: true }
  | { ok: false; error: string };

/** Persist a product gap signal — not chat history. */
export async function executeRecordChatGap(args: {
  businessId: string;
  questionExcerpt: string;
  reason: ChatGapReason;
  topicHint?: string;
}): Promise<RecordChatGapResult> {
  const excerpt = args.questionExcerpt.trim().slice(0, MAX_EXCERPT);
  if (!excerpt) {
    return { ok: false, error: 'Missing question excerpt.' };
  }

  const topicHint = args.topicHint?.trim().slice(0, MAX_TOPIC) || null;

  try {
    const admin = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any).from('assistant_chat_gaps').insert({
      business_id: args.businessId,
      question_excerpt: excerpt,
      reason: args.reason,
      topic_hint: topicHint,
    });

    if (error) {
      console.error('[assistant:chat] recordChatGap', error);
      return { ok: false, error: 'Could not record gap.' };
    }

    return { ok: true };
  } catch (error) {
    console.error('[assistant:chat] recordChatGap', error);
    return { ok: false, error: 'Could not record gap.' };
  }
}
