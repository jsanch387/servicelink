import {
  ADD_ON_DESCRIPTION_TOO_LONG_ERROR,
  normalizeAddOnDescriptionForSave,
} from '@/features/services/add-ons/utils/addOnDescription';
import { ADD_ON_DESCRIPTION_MAX_LENGTH } from '@/features/services/components/add-ons/addOnTypes';
import { describe, expect, it } from 'vitest';

describe('[Services] add-on description', () => {
  it('stores blank input as null', () => {
    expect(normalizeAddOnDescriptionForSave(null)).toEqual({
      ok: true,
      description: null,
    });
    expect(normalizeAddOnDescriptionForSave('   ')).toEqual({
      ok: true,
      description: null,
    });
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeAddOnDescriptionForSave('  Includes wax  ')).toEqual({
      ok: true,
      description: 'Includes wax',
    });
  });

  it('accepts a description at the limit', () => {
    const atLimit = 'a'.repeat(ADD_ON_DESCRIPTION_MAX_LENGTH);
    expect(normalizeAddOnDescriptionForSave(atLimit)).toEqual({
      ok: true,
      description: atLimit,
    });
  });

  it('rejects a description past the limit with a readable message', () => {
    const tooLong = 'a'.repeat(ADD_ON_DESCRIPTION_MAX_LENGTH + 1);
    expect(normalizeAddOnDescriptionForSave(tooLong)).toEqual({
      ok: false,
      error: ADD_ON_DESCRIPTION_TOO_LONG_ERROR,
    });
  });
});
