import { describe, expect, it } from 'vitest';

import {
  activityEntries,
  createSampleDrafts,
  effectiveStatus,
  eveningLines,
  filterActivity,
  sentConfirmation,
} from '../mock/sampleDay';

describe('assistant sample day', () => {
  it('treats untouched drafts as sent once the day moves past prepare', () => {
    const drafts = createSampleDrafts();
    expect(effectiveStatus(drafts[0], 'prepare')).toBe('ready');
    expect(effectiveStatus(drafts[0], 'evening')).toBe('sent');
  });

  it('keeps an explicit skip through the later moments', () => {
    const drafts = createSampleDrafts().map(draft =>
      draft.id === 'sarah-rebook'
        ? { ...draft, status: 'skipped' as const }
        : draft
    );
    expect(effectiveStatus(drafts[1], 'midday')).toBe('skipped');
    expect(sentConfirmation(drafts, 'sent')).toContain('skipped');
    expect(eveningLines(drafts, 'evening').join(' ')).toContain(
      'Sarah’s rebook check-in was skipped'
    );
    expect(
      activityEntries(drafts, 'evening').some(
        entry => entry.id === 'sarah-booked'
      )
    ).toBe(false);
  });

  it('credits a review and a booking when both messages go out', () => {
    const entries = activityEntries(createSampleDrafts(), 'evening');
    expect(entries.map(entry => entry.label)).toEqual([
      'Daily brief ready',
      'Review follow-up prepared',
      'Rebook check-in prepared',
      'Review follow-up sent',
      'Rebook message sent',
      'Rebook message — resulted in a booking',
      'Review request started',
      'Review follow-up — resulted in a review',
      'Reminders sent for tomorrow',
    ]);
    expect(filterActivity(entries, 'outcome').map(entry => entry.id)).toEqual([
      'sarah-booked',
      'jane-reviewed',
    ]);
    expect(filterActivity(entries, 'review').map(entry => entry.id)).toEqual([
      'jane-prepared',
      'jane-sent',
      'dana-invite',
      'jane-reviewed',
    ]);
  });
});
