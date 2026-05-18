import type { ContactTopic } from './types';

export const CONTACT_TOPIC_OPTIONS: {
  value: ContactTopic;
  label: string;
}[] = [
  { value: 'feature_request', label: 'Request a feature' },
  { value: 'bug_report', label: 'Report a bug' },
  { value: 'other', label: 'Something else' },
];

export const CONTACT_TOPIC_LABEL: Record<ContactTopic, string> = {
  feature_request: 'Feature request',
  bug_report: 'Bug report',
  other: 'Other',
};
