// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from './route';
import { hashPassword, SESSION_COOKIE_NAME } from '@/lib/auth';
import { resetRateLimiter } from '@/lib/rateLimiter';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/login', () => {
  beforeEach(async () => {
    resetRateLimiter();
    vi.stubEnv('ADMIN_PASSWORD_HASH', await hashPassword('the-real-password'));
    vi.stubEnv('SESSION_SECRET', 'test-secret');
  });

  it('sets a session cookie and returns ok on a correct password', async () => {
    const response = await POST(makeRequest({ password: 'the-real-password' }));
    const body = await response.json();
    expect(body).toEqual({ ok: true });
    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(setCookie).toContain('HttpOnly');
  });

  it('returns 401 and no cookie on an incorrect password', async () => {
    const response = await POST(makeRequest({ password: 'wrong' }));
    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('returns 401 when the password field is missing', async () => {
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(401);
  });

  it('returns 429 after too many failed attempts', async () => {
    for (let i = 0; i < 5; i += 1) {
      await POST(makeRequest({ password: 'wrong' }));
    }
    const response = await POST(makeRequest({ password: 'the-real-password' }));
    expect(response.status).toBe(429);
  });

  it('returns 500 when the server is not configured', async () => {
    vi.stubEnv('ADMIN_PASSWORD_HASH', '');
    const response = await POST(makeRequest({ password: 'the-real-password' }));
    expect(response.status).toBe(500);
  });
});
