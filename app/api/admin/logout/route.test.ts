// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { POST } from './route';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

describe('POST /api/admin/logout', () => {
  it('clears the session cookie', async () => {
    const response = await POST();
    const body = await response.json();
    expect(body).toEqual({ ok: true });
    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(setCookie).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/);
  });
});
