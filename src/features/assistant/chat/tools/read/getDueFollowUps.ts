import { loadAssistantToday } from '@/features/assistant/today/loadAssistantToday';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export const DUE_FOLLOW_UP_KINDS = ['review', 'check_in', 'all'] as const;
export type DueFollowUpKind = (typeof DUE_FOLLOW_UP_KINDS)[number];

export type GetDueFollowUpsResult =
  | {
      ok: true;
      kind: DueFollowUpKind;
      reviewCount: number;
      checkInCount: number;
      reviews: Array<{
        name: string;
        days: number;
        detail: string;
        visitDate: string;
      }>;
      checkIns: Array<{
        name: string;
        days: number;
        detail: string;
        visitDate: string;
      }>;
    }
  | { ok: false; error: string };

export async function executeGetDueFollowUps(args: {
  businessId: string;
  kind?: DueFollowUpKind;
  now?: Date;
}): Promise<GetDueFollowUpsResult> {
  const kind = args.kind ?? 'all';

  try {
    const admin = createSupabaseAdminClient();
    const today = await loadAssistantToday(
      admin,
      args.businessId,
      args.now ?? new Date()
    );

    const mapPerson = (person: (typeof today.reviews)[number]) => ({
      name: person.name,
      days: person.days,
      detail: person.detail,
      visitDate: person.visitDate,
    });

    const reviews =
      kind === 'check_in' ? [] : today.reviews.slice(0, 10).map(mapPerson);
    const checkIns =
      kind === 'review' ? [] : today.checkIns.slice(0, 10).map(mapPerson);

    return {
      ok: true,
      kind,
      reviewCount: kind === 'check_in' ? 0 : today.reviews.length,
      checkInCount: kind === 'review' ? 0 : today.checkIns.length,
      reviews,
      checkIns,
    };
  } catch (error) {
    console.error('[assistant:chat] getDueFollowUps', error);
    return { ok: false, error: 'Could not load follow-ups right now.' };
  }
}
