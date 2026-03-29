import {
  ADD_ON_DURATION_ERROR,
  addOnDurationPickerValue,
  isValidOptionalAddOnDurationInput,
  parseOptionalAddOnDurationForSave,
} from '@/features/services/utils/addOnDurationForm';
import { describe, expect, it } from 'vitest';

describe('[Services] add-on optional duration', () => {
  it('maps stored minutes to picker value', () => {
    expect(addOnDurationPickerValue(null)).toBe('');
    expect(addOnDurationPickerValue(90)).toBe('01:30');
  });

  it('parses empty as null (no extra time)', () => {
    expect(parseOptionalAddOnDurationForSave('')).toEqual({
      ok: true,
      duration_minutes: null,
    });
    expect(parseOptionalAddOnDurationForSave('  ')).toEqual({
      ok: true,
      duration_minutes: null,
    });
  });

  it('accepts the same 30-minute grid as services', () => {
    expect(parseOptionalAddOnDurationForSave('00:30')).toEqual({
      ok: true,
      duration_minutes: 30,
    });
    expect(parseOptionalAddOnDurationForSave('02:30')).toEqual({
      ok: true,
      duration_minutes: 150,
    });
  });

  it('rejects off-grid minutes', () => {
    expect(parseOptionalAddOnDurationForSave('01:15')).toEqual({
      ok: false,
      error: ADD_ON_DURATION_ERROR,
    });
  });

  it('validates optional field for submit enablement', () => {
    expect(isValidOptionalAddOnDurationInput('')).toBe(true);
    expect(isValidOptionalAddOnDurationInput('01:00')).toBe(true);
    expect(isValidOptionalAddOnDurationInput('01:20')).toBe(false);
  });
});
