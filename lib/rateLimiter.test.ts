import { describe, it, expect, beforeEach } from 'vitest';
import { checkAndRecordAttempt, resetRateLimiter } from '@/lib/rateLimiter';

const options = { maxAttempts: 3, windowMs: 1000 };

describe('checkAndRecordAttempt', () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it('allows attempts up to the configured maximum', () => {
    expect(checkAndRecordAttempt('key-a', options, 0)).toBe(true);
    expect(checkAndRecordAttempt('key-a', options, 0)).toBe(true);
    expect(checkAndRecordAttempt('key-a', options, 0)).toBe(true);
  });

  it('rejects the attempt after the maximum is reached within the window', () => {
    checkAndRecordAttempt('key-b', options, 0);
    checkAndRecordAttempt('key-b', options, 0);
    checkAndRecordAttempt('key-b', options, 0);
    expect(checkAndRecordAttempt('key-b', options, 0)).toBe(false);
  });

  it('allows attempts again once the window has elapsed', () => {
    checkAndRecordAttempt('key-c', options, 0);
    checkAndRecordAttempt('key-c', options, 0);
    checkAndRecordAttempt('key-c', options, 0);
    expect(checkAndRecordAttempt('key-c', options, 0)).toBe(false);
    expect(checkAndRecordAttempt('key-c', options, 1001)).toBe(true);
  });

  it('tracks separate keys independently', () => {
    checkAndRecordAttempt('key-d', options, 0);
    checkAndRecordAttempt('key-d', options, 0);
    checkAndRecordAttempt('key-d', options, 0);
    expect(checkAndRecordAttempt('key-d', options, 0)).toBe(false);
    expect(checkAndRecordAttempt('key-e', options, 0)).toBe(true);
  });
});
