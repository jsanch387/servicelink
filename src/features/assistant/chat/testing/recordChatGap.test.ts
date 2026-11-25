import { beforeEach, describe, expect, it, vi } from 'vitest';

const insertMock = vi.fn();

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({ insert: insertMock }),
  }),
}));

import { executeRecordChatGap } from '../tools/read/recordChatGap';

describe('executeRecordChatGap', () => {
  beforeEach(() => {
    insertMock.mockReset();
    insertMock.mockResolvedValue({ error: null });
  });

  it('inserts a truncated excerpt for the shop', async () => {
    const long = 'x'.repeat(600);
    const result = await executeRecordChatGap({
      businessId: 'biz-1',
      questionExcerpt: `  ${long}  `,
      reason: 'no_tool',
      topicHint: 'schedule',
    });

    expect(result).toEqual({ ok: true });
    expect(insertMock).toHaveBeenCalledWith({
      business_id: 'biz-1',
      question_excerpt: 'x'.repeat(500),
      reason: 'no_tool',
      topic_hint: 'schedule',
    });
  });

  it('rejects empty excerpts', async () => {
    const result = await executeRecordChatGap({
      businessId: 'biz-1',
      questionExcerpt: '   ',
      reason: 'no_tool',
    });
    expect(result.ok).toBe(false);
    expect(insertMock).not.toHaveBeenCalled();
  });
});
