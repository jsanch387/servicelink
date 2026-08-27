import { describe, expect, it } from 'vitest';
import {
  getResizedPublicMediaUrl,
  getStablePublicMediaUrl,
} from '../publicMediaUrl';

describe('publicMediaUrl', () => {
  it('builds a stable object URL from a storage path', () => {
    const url = getStablePublicMediaUrl('businesses/1/work.jpg');
    expect(url).toContain(
      '/storage/v1/object/public/business_images/businesses/1/work.jpg'
    );
    expect(url).not.toContain('?v=');
  });

  it('leaves remote and blob URLs unchanged', () => {
    expect(getStablePublicMediaUrl('https://cdn.example/photo.jpg')).toBe(
      'https://cdn.example/photo.jpg'
    );
    expect(getStablePublicMediaUrl('blob:http://localhost/1')).toBe(
      'blob:http://localhost/1'
    );
  });

  it('converts object URLs to sized render URLs', () => {
    const resized = getResizedPublicMediaUrl('businesses/1/work.jpg', {
      width: 640,
      quality: 70,
    });
    expect(resized).toContain('/storage/v1/render/image/public/');
    expect(resized).toContain('width=640');
    expect(resized).toContain('quality=70');
    expect(resized).not.toContain('?v=');
  });
});
