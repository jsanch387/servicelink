import { describe, expect, it } from 'vitest';
import { getWorkPhotoSrc, toWorkPhotos } from '../utils/workPhotoSrc';

describe('getWorkPhotoSrc', () => {
  it('prefers preview_url', () => {
    expect(
      getWorkPhotoSrc({
        preview_url: 'https://cdn.example/work.jpg',
        storage_path: 'ignored.jpg',
      })
    ).toBe('https://cdn.example/work.jpg');
  });

  it('falls back to the public storage path', () => {
    expect(getWorkPhotoSrc({ storage_path: 'biz/1.jpg' })).toBe(
      'https://qailotbnrtwyzhbwufvk.supabase.co/storage/v1/object/public/business_images/biz/1.jpg'
    );
  });

  it('returns empty when both are missing', () => {
    expect(getWorkPhotoSrc({})).toBe('');
  });
});

describe('toWorkPhotos', () => {
  it('maps images and skips empty sources', () => {
    expect(
      toWorkPhotos([
        { id: 'a', preview_url: 'https://cdn.example/a.jpg' },
        { id: 'b', preview_url: '   ' },
        { storage_path: 'c.jpg' },
      ])
    ).toEqual([
      { id: 'a', src: 'https://cdn.example/a.jpg' },
      {
        id: 'work-2',
        src: 'https://qailotbnrtwyzhbwufvk.supabase.co/storage/v1/object/public/business_images/c.jpg',
      },
    ]);
  });

  it('returns an empty list for missing images', () => {
    expect(toWorkPhotos(undefined)).toEqual([]);
    expect(toWorkPhotos([])).toEqual([]);
  });
});
