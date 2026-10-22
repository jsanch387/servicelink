export const DAY_MOMENTS = [
  { id: 'morning', time: '6:45 AM', label: 'Morning' },
  { id: 'prepare', time: '6:46 AM', label: 'Prepare' },
  { id: 'sent', time: '6:47 AM', label: 'Sent' },
  { id: 'midday', time: '11:15 AM', label: 'Midday' },
  { id: 'evening', time: '6:40 PM', label: 'Evening' },
] as const;

export type DayMoment = (typeof DAY_MOMENTS)[number]['id'];

export type AssistantActionId =
  | 'jane-review'
  | 'luis-review'
  | 'priya-review'
  | 'owen-review'
  | 'sarah-rebook'
  | 'marco-rebook'
  | 'elena-rebook';

export type AssistantActionStatus = 'ready' | 'sent' | 'skipped';

export type AssistantDraft = {
  id: string;
  label: string;
  customerName: string;
  detail: string;
  body: string;
  status: AssistantActionStatus;
};

export type AssistantView = 'today' | 'activity';

export type ActivityKind =
  | 'brief'
  | 'review'
  | 'rebook'
  | 'outcome'
  | 'reminder';

export type ActivityFilter = 'all' | 'review' | 'rebook' | 'outcome';

export type ActivityTopic = 'brief' | 'review' | 'rebook' | 'reminder';

export type ActivityEntry = {
  id: string;
  time: string;
  label: string;
  detail: string;
  kind: ActivityKind;
  topic: ActivityTopic;
  actor: 'Assistant' | 'You' | 'System';
};

export type SampleJob = {
  time: string;
  title: string;
  customer: string;
};
