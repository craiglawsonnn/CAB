import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE_NAME,
} from '@/lib/auth';

describe('password hashing', () => {
  it('verifies a correct password against its hash', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');
    expect(await verifyPassword('correct-horse-battery-staple', hash)).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });
});

describe('session tokens', () => {
  const secret = 'test-session-secret';

  it('verifies a freshly created token', () => {
    const token = createSessionToken(secret);
    expect(verifySessionToken(token, secret)).toBe(true);
  });

  it('rejects a token signed with a different secret', () => {
    const token = createSessionToken(secret);
    expect(verifySessionToken(token, 'a-different-secret')).toBe(false);
  });

  it('rejects a tampered payload', () => {
    const token = createSessionToken(secret);
    const [, signature] = token.split('.');
    const tampered = `${Buffer.from(JSON.stringify({ expiresAt: 9999999999999 })).toString('base64url')}.${signature}`;
    expect(verifySessionToken(tampered, secret)).toBe(false);
  });

  it('rejects an expired token', () => {
    const issuedAt = 1_000_000_000_000;
    const token = createSessionToken(secret, issuedAt);
    const oneDayAndOneMsLater = issuedAt + 24 * 60 * 60 * 1000 + 1;
    expect(verifySessionToken(token, secret, oneDayAndOneMsLater)).toBe(false);
  });

  it('accepts a token checked just before expiry', () => {
    const issuedAt = 1_000_000_000_000;
    const token = createSessionToken(secret, issuedAt);
    const almostADayLater = issuedAt + 24 * 60 * 60 * 1000 - 1;
    expect(verifySessionToken(token, secret, almostADayLater)).toBe(true);
  });

  it('exposes a stable cookie name', () => {
    expect(SESSION_COOKIE_NAME).toBe('cab_admin_session');
  });
});
