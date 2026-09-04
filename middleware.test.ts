// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

const SECRET = 'test-secret';

function requestWithCookie(path: string, cookieValue?: string) {
  const headers = new Headers();
  if (cookieValue !== undefined) {
    headers.set('cookie', `${SESSION_COOKIE_NAME}=${cookieValue}`);
  }
  return new NextRequest(new Request(`http://localhost${path}`, { headers }));
}

describe('middleware', () => {
  it('lets an authenticated request through to /admin', () => {
    process.env.SESSION_SECRET = SECRET;
    const token = createSessionToken(SECRET);
    const response = middleware(requestWithCookie('/admin', token));
    expect(response.status).toBe(200);
  });

  it('redirects an unauthenticated /admin request to /admin/login', () => {
    process.env.SESSION_SECRET = SECRET;
    const response = middleware(requestWithCookie('/admin'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/admin/login');
  });

  it('always allows /admin/login through, even without a cookie', () => {
    process.env.SESSION_SECRET = SECRET;
    const response = middleware(requestWithCookie('/admin/login'));
    expect(response.status).toBe(200);
  });

  it('returns 401 JSON for an unauthenticated /api/admin/save request', async () => {
    process.env.SESSION_SECRET = SECRET;
    const response = middleware(requestWithCookie('/api/admin/save'));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.ok).toBe(false);
  });

  it('always allows /api/admin/login through', () => {
    process.env.SESSION_SECRET = SECRET;
    const response = middleware(requestWithCookie('/api/admin/login'));
    expect(response.status).toBe(200);
  });

  it('rejects a session cookie signed with a different secret', () => {
    process.env.SESSION_SECRET = SECRET;
    const token = createSessionToken('a-different-secret');
    const response = middleware(requestWithCookie('/admin', token));
    expect(response.status).toBe(307);
  });
});
