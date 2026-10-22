import type {
  ActivityEntry,
  ActivityFilter,
  AssistantDraft,
  DayMoment,
  SampleJob,
} from '../types';

const LATER_MOMENTS: readonly DayMoment[] = ['sent', 'midday', 'evening'];

export const SAMPLE_JOBS: readonly SampleJob[] = [
  { time: '8:00 AM', title: 'Ceramic coating', customer: 'Mike' },
  { time: '10:30 AM', title: 'Interior detail', customer: 'Alex' },
  { time: '1:00 PM', title: 'Full detail', customer: 'Chris' },
  { time: '3:30 PM', title: 'Maintenance wash', customer: 'Dana' },
];

const SAMPLE_DRAFTS: readonly AssistantDraft[] = [
  {
    id: 'jane-review',
    label: 'Review follow-up',
    customerName: 'Jane',
    detail: 'No review yet. It’s been 3 days.',
    body: 'Hey Jane, hope the detail is still looking great. Would you mind leaving a quick review when you get a chance? It really helps. [review link]',
    status: 'ready',
  },
  {
    id: 'sarah-rebook',
    label: 'Booking message',
    customerName: 'Sarah',
    detail: 'Hasn’t booked in 52 days.',
    body: 'Hey Sarah, it’s been 52 days since your last detail. I can hold a spot this week or next. Book here: [booking link]. Or call or text me.',
    status: 'ready',
  },
  {
    id: 'luis-review',
    label: 'Review follow-up',
    customerName: 'Luis',
    detail: 'No review yet. It’s been 5 days.',
    body: 'Hey Luis, hope the detail is still looking great. Would you mind leaving a quick review when you get a chance? [review link]',
    status: 'ready',
  },
  {
    id: 'priya-review',
    label: 'Review follow-up',
    customerName: 'Priya',
    detail: 'No review yet. It’s been 4 days.',
    body: 'Hey Priya, hope the detail is still looking great. Would you mind leaving a quick review when you get a chance? [review link]',
    status: 'ready',
  },
  {
    id: 'owen-review',
    label: 'Review follow-up',
    customerName: 'Owen',
    detail: 'No review yet. It’s been 8 days.',
    body: 'Hey Owen, hope the detail is still looking great. Would you mind leaving a quick review when you get a chance? [review link]',
    status: 'ready',
  },
  {
    id: 'marco-rebook',
    label: 'Booking message',
    customerName: 'Marco',
    detail: 'Hasn’t booked in 61 days.',
    body: 'Hey Marco, it’s been 61 days since your last detail. I can hold a spot this week or next. Book here: [booking link]. Or call or text me.',
    status: 'ready',
  },
  {
    id: 'elena-rebook',
    label: 'Booking message',
    customerName: 'Elena',
    detail: 'Hasn’t booked in 44 days.',
    body: 'Hey Elena, it’s been 44 days since your last detail. I can hold a spot this week or next. Book here: [booking link]. Or call or text me.',
    status: 'ready',
  },
];

export function createSampleDrafts(): AssistantDraft[] {
  return SAMPLE_DRAFTS.map(draft => ({ ...draft }));
}

/** Later moments show the sample outcome for anything still waiting. */
export function effectiveStatus(
  draft: AssistantDraft,
  moment: DayMoment
): AssistantDraft['status'] {
  if (draft.status !== 'ready') return draft.status;
  if (LATER_MOMENTS.includes(moment)) return 'sent';
  return 'ready';
}

export function draftById(
  drafts: readonly AssistantDraft[],
  id: AssistantDraft['id']
): AssistantDraft {
  const draft = drafts.find(item => item.id === id);
  if (!draft) {
    throw new Error(`Missing sample draft ${id}`);
  }
  return draft;
}

export function sentConfirmation(
  drafts: readonly AssistantDraft[],
  moment: DayMoment
): string {
  const jane = effectiveStatus(draftById(drafts, 'jane-review'), moment);
  const sarah = effectiveStatus(draftById(drafts, 'sarah-rebook'), moment);

  if (jane === 'sent' && sarah === 'sent') {
    return 'Both are on their way. I’ll watch for Jane’s review and Sarah’s booking.';
  }
  if (jane === 'sent' && sarah === 'skipped') {
    return 'Jane’s note is on its way. You skipped Sarah, so I won’t tie a booking to this.';
  }
  if (jane === 'skipped' && sarah === 'sent') {
    return 'Sarah’s note is on its way. You skipped Jane, so I won’t tie a review to this.';
  }
  return 'All good. You skipped both, so nothing went out.';
}

export function activityEntries(
  drafts: readonly AssistantDraft[],
  moment: DayMoment
): ActivityEntry[] {
  const jane = draftById(drafts, 'jane-review');
  const sarah = draftById(drafts, 'sarah-rebook');
  const janeStatus = effectiveStatus(jane, moment);
  const sarahStatus = effectiveStatus(sarah, moment);
  const pastPrepare = moment !== 'morning';
  const pastSent = LATER_MOMENTS.includes(moment);

  const entries: ActivityEntry[] = [
    {
      id: 'brief',
      time: '6:45 AM',
      label: 'Daily brief ready',
      detail: '7 messages worth sending before the first job.',
      kind: 'brief',
      topic: 'brief',
      actor: 'Assistant',
    },
  ];

  if (pastPrepare) {
    entries.push(
      {
        id: 'jane-prepared',
        time: '6:46 AM',
        label: 'Review follow-up prepared',
        detail: `${jane.customerName}. ${jane.detail}`,
        kind: 'review',
        topic: 'review',
        actor: 'Assistant',
      },
      {
        id: 'sarah-prepared',
        time: '6:46 AM',
        label: 'Rebook check-in prepared',
        detail: `${sarah.customerName}. ${sarah.detail}`,
        kind: 'rebook',
        topic: 'rebook',
        actor: 'Assistant',
      }
    );
  }

  if (pastSent && janeStatus === 'sent') {
    entries.push({
      id: 'jane-sent',
      time: '6:47 AM',
      label: 'Review follow-up sent',
      detail: jane.body,
      kind: 'review',
      topic: 'review',
      actor: 'You',
    });
  }
  if (pastSent && janeStatus === 'skipped') {
    entries.push({
      id: 'jane-skipped',
      time: '6:47 AM',
      label: 'Review follow-up skipped',
      detail: 'Jane’s second review request was not sent.',
      kind: 'review',
      topic: 'review',
      actor: 'You',
    });
  }
  if (pastSent && sarahStatus === 'sent') {
    entries.push({
      id: 'sarah-sent',
      time: '6:47 AM',
      label: 'Rebook message sent',
      detail: sarah.body,
      kind: 'rebook',
      topic: 'rebook',
      actor: 'You',
    });
  }
  if (pastSent && sarahStatus === 'skipped') {
    entries.push({
      id: 'sarah-skipped',
      time: '6:47 AM',
      label: 'Rebook message skipped',
      detail: 'Sarah’s check-in was not sent.',
      kind: 'rebook',
      topic: 'rebook',
      actor: 'You',
    });
  }

  if ((moment === 'midday' || moment === 'evening') && sarahStatus === 'sent') {
    entries.push({
      id: 'sarah-booked',
      time: '11:15 AM',
      label: 'Rebook message — resulted in a booking',
      detail:
        'Sarah booked Thursday at 2:00 PM from the check-in you approved.',
      kind: 'outcome',
      topic: 'rebook',
      actor: 'Assistant',
    });
  }

  if (moment === 'evening') {
    entries.push({
      id: 'dana-invite',
      time: '3:48 PM',
      label: 'Review request started',
      detail:
        'Dana’s job was completed. The first receipt and review link went out.',
      kind: 'review',
      topic: 'review',
      actor: 'System',
    });
  }

  if (moment === 'evening' && janeStatus === 'sent') {
    entries.push({
      id: 'jane-reviewed',
      time: '4:10 PM',
      label: 'Review follow-up — resulted in a review',
      detail: 'Jane left a review after the follow-up you approved.',
      kind: 'outcome',
      topic: 'review',
      actor: 'Assistant',
    });
  }

  if (moment === 'evening') {
    entries.push({
      id: 'reminders',
      time: '5:00 PM',
      label: 'Reminders sent for tomorrow',
      detail: '2 day-before reminders went out for tomorrow’s jobs.',
      kind: 'reminder',
      topic: 'reminder',
      actor: 'System',
    });
  }

  return entries;
}

export function eveningLines(
  drafts: readonly AssistantDraft[],
  moment: DayMoment
): string[] {
  const jane = effectiveStatus(draftById(drafts, 'jane-review'), moment);
  const sarah = effectiveStatus(draftById(drafts, 'sarah-rebook'), moment);
  const lines = [
    jane === 'sent'
      ? 'Jane left a review. The note you sent this morning did it.'
      : 'Jane’s follow-up stayed with you, so I won’t count a review toward it.',
    sarah === 'sent'
      ? 'Sarah rebooked for Thursday at 2:00 PM.'
      : 'Sarah’s rebook check-in was skipped.',
    'Tomorrow’s two reminders already went out.',
    'Dana’s job wrapped up, so her first review link is on its way.',
  ];
  return lines;
}

export function filterActivity(
  entries: readonly ActivityEntry[],
  filter: ActivityFilter
): ActivityEntry[] {
  if (filter === 'all') return [...entries];
  if (filter === 'outcome') {
    return entries.filter(entry => entry.kind === 'outcome');
  }
  return entries.filter(entry => entry.topic === filter);
}
