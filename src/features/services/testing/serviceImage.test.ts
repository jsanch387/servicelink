import { describe, expect, it } from 'vitest';
import {
  getServiceImagePath,
  serviceImageInitial,
} from '../utils/serviceImage';

describe('serviceImage', () => {
  it('reads a stored image path', () => {
    expect(
      getServiceImagePath({ image_path: ' businesses/1/services/a.jpg ' })
    ).toBe('businesses/1/services/a.jpg');
    expect(getServiceImagePath({ image_path: '' })).toBeNull();
    expect(getServiceImagePath({ image_path: null })).toBeNull();
    expect(getServiceImagePath({})).toBeNull();
  });

  it('uses the first letter of the service name as a placeholder', () => {
    expect(serviceImageInitial('Full detail')).toBe('F');
    expect(serviceImageInitial('  oil change')).toBe('O');
    expect(serviceImageInitial('')).toBe('S');
    expect(serviceImageInitial(null)).toBe('S');
  });
});
