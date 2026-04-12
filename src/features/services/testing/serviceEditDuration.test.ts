import type { ServiceRow } from '@/features/services/types/services';
import {
  SERVICE_EDIT_DURATION_ERROR,
  isValidServiceEditDurationInput,
  parseServiceEditDurationForSave,
  resolveStoredDurationMinutes,
  serviceEditDurationPickerValue,
} from '@/features/services/utils/serviceEditForm';
import { describe, expect, it } from 'vitest';

function serviceRow(partial: Partial<ServiceRow>): ServiceRow {
  return {
    id: 'svc-test',
    business_id: 'biz-test',
    name: 'Test service',
    description: null,
    price_cents: null,
    hours_to_complete: null,
    duration_minutes: null,
    price_options_enabled: false,
    is_active: true,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

describe('[Services] resolveStoredDurationMinutes', () => {
  it('prefers duration_minutes when both are set', () => {
    expect(
      resolveStoredDurationMinutes(
        serviceRow({ duration_minutes: 90, hours_to_complete: 1 })
      )
    ).toBe(90);
  });

  it('falls back to hours_to_complete when duration_minutes is null', () => {
    expect(
      resolveStoredDurationMinutes(
        serviceRow({ duration_minutes: null, hours_to_complete: 2.5 })
      )
    ).toBe(150);
  });

  it('returns null when both are missing or non-positive', () => {
    expect(
      resolveStoredDurationMinutes(
        serviceRow({ duration_minutes: null, hours_to_complete: null })
      )
    ).toBeNull();
    expect(
      resolveStoredDurationMinutes(
        serviceRow({ duration_minutes: 0, hours_to_complete: 0 })
      )
    ).toBeNull();
  });
});

describe('[Services] serviceEditDurationPickerValue', () => {
  it('maps whole hours and half hours to HH:mm strings', () => {
    expect(
      serviceEditDurationPickerValue(serviceRow({ duration_minutes: 60 }))
    ).toBe('01:00');
    expect(
      serviceEditDurationPickerValue(serviceRow({ duration_minutes: 90 }))
    ).toBe('01:30');
    expect(
      serviceEditDurationPickerValue(serviceRow({ duration_minutes: 150 }))
    ).toBe('02:30');
    expect(
      serviceEditDurationPickerValue(serviceRow({ duration_minutes: 630 }))
    ).toBe('10:30');
  });

  it('returns empty string when no duration is stored', () => {
    expect(
      serviceEditDurationPickerValue(
        serviceRow({ duration_minutes: null, hours_to_complete: null })
      )
    ).toBe('');
  });

  it('snaps legacy odd minutes to the nearest 30m step within allowed range', () => {
    expect(
      serviceEditDurationPickerValue(serviceRow({ duration_minutes: 45 }))
    ).toBe('01:00');
    expect(
      serviceEditDurationPickerValue(serviceRow({ duration_minutes: 15 }))
    ).toBe('00:30');
  });
});

describe('[Services] parseServiceEditDurationForSave', () => {
  it('accepts grid values and returns minutes for API payload', () => {
    expect(parseServiceEditDurationForSave('00:30')).toEqual({
      ok: true,
      durationMinutes: 30,
    });
    expect(parseServiceEditDurationForSave('02:30')).toEqual({
      ok: true,
      durationMinutes: 150,
    });
    expect(parseServiceEditDurationForSave('10:30')).toEqual({
      ok: true,
      durationMinutes: 630,
    });
  });

  it('rejects empty, off-grid minutes, and out-of-range totals', () => {
    const err = { ok: false as const, error: SERVICE_EDIT_DURATION_ERROR };
    expect(parseServiceEditDurationForSave('')).toEqual(err);
    expect(parseServiceEditDurationForSave('   ')).toEqual(err);
    expect(parseServiceEditDurationForSave('01:15')).toEqual(err);
    expect(parseServiceEditDurationForSave('00:00')).toEqual(err);
    expect(parseServiceEditDurationForSave('11:00')).toEqual(err);
    expect(parseServiceEditDurationForSave('not-a-time')).toEqual(err);
  });

  it('round-trips picker → save minutes → picker after load', () => {
    const saved = parseServiceEditDurationForSave('02:30');
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const reloaded = serviceEditDurationPickerValue(
      serviceRow({ duration_minutes: saved.durationMinutes })
    );
    expect(reloaded).toBe('02:30');
  });
});

describe('[Services] isValidServiceEditDurationInput', () => {
  it('mirrors submit validity for the duration field', () => {
    expect(isValidServiceEditDurationInput('')).toBe(false);
    expect(isValidServiceEditDurationInput('01:00')).toBe(true);
    expect(isValidServiceEditDurationInput(' 01:00 ')).toBe(true);
    expect(isValidServiceEditDurationInput('01:15')).toBe(false);
  });
});
