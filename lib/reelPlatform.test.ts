import { describe, it, expect } from 'vitest';
import { detectPlatform } from '@/lib/reelPlatform';

describe('detectPlatform', () => {
  it('detects instagram urls', () => {
    expect(detectPlatform('https://www.instagram.com/reel/abc123/')).toBe('instagram');
  });

  it('detects tiktok urls', () => {
    expect(detectPlatform('https://www.tiktok.com/@cab/video/123')).toBe('tiktok');
  });

  it('falls back to unknown for other urls', () => {
    expect(detectPlatform('https://example.com/video')).toBe('unknown');
  });
});
