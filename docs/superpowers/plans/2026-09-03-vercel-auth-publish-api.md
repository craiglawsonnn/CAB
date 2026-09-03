# Vercel Migration, Auth & Publish API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the site's hosting to Vercel, add a password-protected admin login with signed sessions, and build the `/api/admin/save` endpoint that publishes content edits as a real git commit — everything the admin dashboard (a follow-up plan) needs to actually save changes. No admin UI is built here; this plan ends with a working, curl-able backend and a stub `/admin` page.

**Architecture:** Drop the GitHub Pages static export in favor of Vercel's native Next.js hosting (already connected — see Manual Setup below). Add a stateless, signed-cookie session (HMAC, no session database) checked by Next.js middleware on every `/admin` and `/api/admin/*` request. The save endpoint validates its payload, compresses any new images with `sharp`, and commits everything atomically to `main` via GitHub's Git Data API — Vercel's existing GitHub integration then redeploys automatically, exactly the way pushing any other commit does today.

**Tech Stack:** Next.js 15 (App Router route handlers + middleware), `bcryptjs` (password hashing), `@octokit/rest` (GitHub API), `sharp` (already a dependency, image compression), Vitest + Testing Library (existing test stack).

**Spec:** `docs/superpowers/specs/2026-09-03-admin-cms-design.md` (this plan implements sections 1, 3, and 5 — section 4, the admin UI itself, is a separate follow-up plan; section 2 was implemented by the prior `2026-09-03-content-model-expansion` plan).

## Manual Setup (already done)

- Vercel project created and connected to `craiglawsonnn/CAB`, deployed successfully at `https://cab-chi.vercel.app/` (currently just serving the old static export — this plan's Task 1 changes that).
- A fine-grained GitHub personal access token has been generated, scoped to only the `CAB` repository with **Contents: Read and write** permission. It is not yet stored anywhere in the codebase or Vercel — Task 9 covers adding it (and the other secrets this plan introduces) to Vercel's environment variables.

## Global Constraints

- No secret (password, session secret, GitHub token) is ever sent to or readable from the browser — everything server-side-only, via Vercel environment variables.
- Every route under `/admin` and `/api/admin/*` (except `/admin/login` and `/api/admin/login`) must be unreachable without a valid session — enforced centrally in `middleware.ts`, not per-route.
- Publishing content is one atomic commit (content + all image changes together via the Git Data API) — never a sequence of independent file writes that could partially fail.
- Follow TDD for every step: failing test first, watch it fail, minimal code, watch it pass, commit.
- Route handler and middleware tests run under the Node test environment (`// @vitest-environment node` docblock), not the project's default jsdom environment — they exercise server runtime code, not DOM.

---

### Task 1: Remove GitHub Pages hosting config

**Files:**
- Modify: `next.config.js`
- Modify: `content/site.ts`
- Delete: `lib/basePath.ts`
- Delete: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: nothing new.
- Produces: `siteConfig` (from `content/site.ts`) keeps its existing exported shape and values — only the internal construction changes (no more `basePath` prefixing, since Vercel serves from the domain root).

- [ ] **Step 1: Confirm nothing else references `lib/basePath.ts` before deleting it**

Run: `grep -rn "basePath" --include="*.ts" --include="*.tsx" --include="*.js" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=out`
Expected: only `content/site.ts` and `next.config.js` reference it (plus this plan's own docs). If anything else references it, stop and report NEEDS_CONTEXT.

- [ ] **Step 2: Simplify `next.config.js`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = nextConfig;
```

- [ ] **Step 3: Simplify `content/site.ts`'s export**

Remove the `import { basePath } from '@/lib/basePath';` line, remove the `withBasePath` function, and replace the entire `siteConfig` construction at the bottom of the file with:

```typescript
export const siteConfig: SiteConfig = raw;
```

(The `beforeAfter.pairs`/`gallery.images` `.map()` calls and the `logoSrc`/`heroImageSrc` overrides all existed solely to prefix image paths for GitHub Pages — with no `basePath` left, `raw` already has the correct shape and values, so the whole custom-construction block collapses to a direct assignment.) Everything above this line (the `NavLink`, `NavConfig`, ... `SiteConfig` interfaces, and the `import raw from './site.json';` line) stays exactly as-is.

- [ ] **Step 4: Delete the now-unused files**

```bash
rm lib/basePath.ts
rm .github/workflows/deploy.yml
```

- [ ] **Step 5: Run the full suite, typecheck, and a normal production build**

Run: `npx vitest run`
Expected: all tests PASS (this plan doesn't change any test file, since `content/site.test.ts`'s image-existence assertions strip the leading `/` and check against `public/` directly — unaffected by the basePath removal).

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: succeeds, produces a `.next/` directory (no `GITHUB_PAGES` env var, no `out/` — this is the Vercel-style build Vercel itself runs on every push).

- [ ] **Step 6: Commit**

```bash
git add next.config.js content/site.ts
git rm lib/basePath.ts .github/workflows/deploy.yml
git commit -m "chore: drop GitHub Pages hosting config, now deploying via Vercel"
```

---

### Task 2: Password hashing + signed session tokens (`lib/auth.ts`)

**Files:**
- Create: `lib/auth.ts`
- Create: `lib/auth.test.ts`
- Create: `scripts/hash-password.mjs`
- Modify: `package.json` (add `bcryptjs` dependency, `@types/bcryptjs` devDependency, `hash-password` script)

**Interfaces:**
- Produces: `hashPassword(password: string): Promise<string>`, `verifyPassword(password: string, hash: string): Promise<boolean>`, `createSessionToken(secret: string, now?: number): string`, `verifySessionToken(token: string, secret: string, now?: number): boolean`, `SESSION_COOKIE_NAME: string` — all consumed by Tasks 4, 5, and 6.

- [ ] **Step 1: Add dependencies**

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 2: Write the failing tests**

```typescript
// lib/auth.test.ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/auth.test.ts`
Expected: FAIL — `lib/auth.ts` doesn't exist yet, so the import fails.

- [ ] **Step 3: Write `lib/auth.ts`**

```typescript
import bcrypt from 'bcryptjs';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'cab_admin_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSessionToken(secret: string, now: number = Date.now()): string {
  const expiresAt = now + SESSION_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ expiresAt })).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(
  token: string,
  secret: string,
  now: number = Date.now()
): boolean {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = sign(payload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) return false;
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return false;

  let parsed: { expiresAt?: unknown };
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
  } catch {
    return false;
  }

  return typeof parsed.expiresAt === 'number' && now < parsed.expiresAt;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/auth.test.ts`
Expected: all PASS.

- [ ] **Step 5: Add the password-hashing helper script**

```javascript
// scripts/hash-password.mjs
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run hash-password -- "your-password"');
  process.exit(1);
}

console.log(bcrypt.hashSync(password, 10));
```

In `package.json`, add to `"scripts"`: `"hash-password": "node scripts/hash-password.mjs"`.

- [ ] **Step 6: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/auth.ts lib/auth.test.ts scripts/hash-password.mjs package.json package-lock.json
git commit -m "feat: add password hashing and signed session token utilities"
```

---

### Task 3: In-memory login rate limiter (`lib/rateLimiter.ts`)

**Files:**
- Create: `lib/rateLimiter.ts`
- Create: `lib/rateLimiter.test.ts`

**Interfaces:**
- Produces: `checkAndRecordAttempt(key: string, options: { maxAttempts: number; windowMs: number }, now?: number): boolean` — `true` if this attempt is allowed (and is recorded), `false` if the key is currently rate-limited. `resetRateLimiter(): void` — test-only helper that clears all recorded state. Consumed by Task 4's login route.

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/rateLimiter.test.ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/rateLimiter.test.ts`
Expected: FAIL — `lib/rateLimiter.ts` doesn't exist yet.

- [ ] **Step 3: Write `lib/rateLimiter.ts`**

```typescript
interface Attempt {
  count: number;
  windowStart: number;
}

const attempts = new Map<string, Attempt>();

export function checkAndRecordAttempt(
  key: string,
  options: { maxAttempts: number; windowMs: number },
  now: number = Date.now()
): boolean {
  const existing = attempts.get(key);

  if (!existing || now - existing.windowStart >= options.windowMs) {
    attempts.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (existing.count >= options.maxAttempts) {
    return false;
  }

  existing.count += 1;
  return true;
}

export function resetRateLimiter(): void {
  attempts.clear();
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/rateLimiter.test.ts`
Expected: all PASS.

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/rateLimiter.ts lib/rateLimiter.test.ts
git commit -m "feat: add in-memory login rate limiter"
```

---

### Task 4: Login and logout API routes

**Files:**
- Create: `app/api/admin/login/route.ts`
- Create: `app/api/admin/login/route.test.ts`
- Create: `app/api/admin/logout/route.ts`
- Create: `app/api/admin/logout/route.test.ts`

**Interfaces:**
- Consumes: `hashPassword`/`verifyPassword`/`createSessionToken`/`SESSION_COOKIE_NAME` from `lib/auth.ts` (Task 2), `checkAndRecordAttempt` from `lib/rateLimiter.ts` (Task 3).
- Produces: `POST /api/admin/login` (body `{ password: string }`, sets the session cookie on success), `POST /api/admin/logout` (clears the session cookie) — consumed by Task 5 (middleware reads the same cookie name) and Task 6 (the login page and dashboard call these routes).

- [ ] **Step 1: Write the failing tests**

```typescript
// app/api/admin/login/route.test.ts
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
```

```typescript
// app/api/admin/logout/route.test.ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run app/api/admin/login/route.test.ts app/api/admin/logout/route.test.ts`
Expected: FAIL — neither route file exists yet.

- [ ] **Step 3: Write `app/api/admin/login/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { checkAndRecordAttempt } from '@/lib/rateLimiter';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const allowed = checkAndRecordAttempt(`login:${ip}`, {
    maxAttempts: MAX_ATTEMPTS,
    windowMs: WINDOW_MS,
  });
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many attempts. Try again later.' },
      { status: 429 }
    );
  }

  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!passwordHash || !sessionSecret) {
    return NextResponse.json({ ok: false, error: 'Server not configured.' }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === 'string' ? body.password : '';

  const valid = password.length > 0 && (await verifyPassword(password, passwordHash));
  if (!valid) {
    return NextResponse.json({ ok: false, error: 'Incorrect password.' }, { status: 401 });
  }

  const token = createSessionToken(sessionSecret);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
  return response;
}
```

- [ ] **Step 4: Write `app/api/admin/logout/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return response;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run app/api/admin/login/route.test.ts app/api/admin/logout/route.test.ts`
Expected: all PASS.

- [ ] **Step 6: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/api/admin/login/route.ts app/api/admin/login/route.test.ts app/api/admin/logout/route.ts app/api/admin/logout/route.test.ts
git commit -m "feat: add admin login and logout API routes"
```

---

### Task 5: Middleware protecting `/admin` and `/api/admin/*`

**Files:**
- Create: `middleware.ts`
- Create: `middleware.test.ts`

**Interfaces:**
- Consumes: `SESSION_COOKIE_NAME`/`verifySessionToken` from `lib/auth.ts` (Task 2).
- Produces: every request to `/admin/*` or `/api/admin/*` (except `/admin/login` and `/api/admin/login`) is redirected (page routes) or rejected with 401 JSON (API routes) unless it carries a valid session cookie — this is what makes Task 6's dashboard page and any future admin UI actually protected.

- [ ] **Step 1: Write the failing tests**

```typescript
// middleware.test.ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run middleware.test.ts`
Expected: FAIL — `middleware.ts` doesn't exist yet.

- [ ] **Step 3: Write `middleware.ts`**

```typescript
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

const PUBLIC_PATHS = new Set(['/admin/login', '/api/admin/login']);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const secret = process.env.SESSION_SECRET;
  const authenticated = Boolean(token && secret && verifySessionToken(token, secret));

  if (authenticated) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/admin')) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.redirect(new URL('/admin/login', request.url));
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run middleware.test.ts`
Expected: all PASS.

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add middleware.ts middleware.test.ts
git commit -m "feat: add session-checking middleware for /admin and /api/admin routes"
```

---

### Task 6: Login page and stub admin dashboard page

**Files:**
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/login/page.module.css`
- Create: `app/admin/login/page.test.tsx`
- Create: `app/admin/LogoutButton.tsx`
- Create: `app/admin/LogoutButton.test.tsx`
- Create: `app/admin/page.tsx`
- Create: `app/admin/page.test.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/login` and `POST /api/admin/logout` (Task 4), protected implicitly by the middleware (Task 5).
- Produces: a real login form at `/admin/login`, and a stub `/admin` page (heading + logout button) that a follow-up plan replaces with the actual content editor. This is what makes the whole plan's login flow observable end-to-end rather than just API-level.

- [ ] **Step 1: Write the failing test for the login page**

```typescript
// app/admin/login/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

import AdminLoginPage from './page';

describe('AdminLoginPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    vi.restoreAllMocks();
  });

  it('redirects to /admin on a successful login', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    const user = userEvent.setup();
    render(<AdminLoginPage />);

    await user.type(screen.getByLabelText('Password'), 'the-real-password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(pushMock).toHaveBeenCalledWith('/admin');
  });

  it('shows an error message on a failed login', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: 'Incorrect password.' }), { status: 401 })
    );
    const user = userEvent.setup();
    render(<AdminLoginPage />);

    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect password.');
    expect(pushMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run app/admin/login/page.test.tsx`
Expected: FAIL — `app/admin/login/page.tsx` doesn't exist yet.

- [ ] **Step 3: Write `app/admin/login/page.tsx` and its stylesheet**

```typescript
// app/admin/login/page.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await response.json();
    setSubmitting(false);

    if (data.ok) {
      router.push('/admin');
      return;
    }
    setError(data.error ?? 'Login failed.');
  };

  return (
    <main className={styles.page}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1>Admin Login</h1>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </main>
  );
}
```

```css
/* app/admin/login/page.module.css */
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 320px;
  padding: 32px;
  border: 1px solid var(--color-chrome-mid, #ccc);
  border-radius: 12px;
}

.form input {
  padding: 10px 12px;
  font-size: 1rem;
  border-radius: 6px;
  border: 1px solid var(--color-chrome-mid, #ccc);
}

.form button {
  padding: 10px 12px;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
}

.error {
  color: #c0392b;
  font-size: 0.9em;
}
```

- [ ] **Step 4: Run the login page test to verify it passes**

Run: `npx vitest run app/admin/login/page.test.tsx`
Expected: all PASS.

- [ ] **Step 5: Write the failing test for the logout button**

```typescript
// app/admin/LogoutButton.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

import LogoutButton from './LogoutButton';

describe('LogoutButton', () => {
  beforeEach(() => {
    pushMock.mockClear();
    vi.restoreAllMocks();
  });

  it('calls the logout endpoint and redirects to the login page', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(new Response('{}'));
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/logout', { method: 'POST' });
    expect(pushMock).toHaveBeenCalledWith('/admin/login');
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run app/admin/LogoutButton.test.tsx`
Expected: FAIL — `app/admin/LogoutButton.tsx` doesn't exist yet.

- [ ] **Step 7: Write `app/admin/LogoutButton.tsx`**

```typescript
'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <button type="button" onClick={handleLogout}>
      Log out
    </button>
  );
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run app/admin/LogoutButton.test.tsx`
Expected: PASS.

- [ ] **Step 9: Write the failing test for the stub dashboard page**

```typescript
// app/admin/page.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import AdminDashboardPage from './page';

describe('AdminDashboardPage', () => {
  it('renders a heading and a logout button', () => {
    render(<AdminDashboardPage />);
    expect(screen.getByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 10: Run the test to verify it fails**

Run: `npx vitest run app/admin/page.test.tsx`
Expected: FAIL — `app/admin/page.tsx` doesn't exist yet.

- [ ] **Step 11: Write `app/admin/page.tsx`**

```typescript
import LogoutButton from './LogoutButton';

export default function AdminDashboardPage() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Admin Dashboard</h1>
      <p>Content editing tools are coming soon.</p>
      <LogoutButton />
    </main>
  );
}
```

- [ ] **Step 12: Run the test to verify it passes**

Run: `npx vitest run app/admin/page.test.tsx`
Expected: PASS.

- [ ] **Step 13: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 14: Commit**

```bash
git add app/admin
git commit -m "feat: add admin login page and stub dashboard page"
```

---

### Task 7: GitHub publish client (`lib/github.ts`)

**Files:**
- Create: `lib/github.ts`
- Create: `lib/github.test.ts`
- Modify: `package.json` (add `@octokit/rest` dependency)

**Interfaces:**
- Produces: `FileChange` type (`{ path: string; action: 'upsert' | 'delete'; content?: string }`, `content` is base64-encoded), `publishFiles(changes: FileChange[], commitMessage: string, token?: string): Promise<{ commitSha: string }>` — consumed by Task 9's save route.

- [ ] **Step 1: Add the dependency**

```bash
npm install @octokit/rest
```

- [ ] **Step 2: Write the failing tests**

```typescript
// lib/github.test.ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetRef = vi.fn();
const mockGetCommit = vi.fn();
const mockCreateBlob = vi.fn();
const mockCreateTree = vi.fn();
const mockCreateCommit = vi.fn();
const mockUpdateRef = vi.fn();

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    git: {
      getRef: mockGetRef,
      getCommit: mockGetCommit,
      createBlob: mockCreateBlob,
      createTree: mockCreateTree,
      createCommit: mockCreateCommit,
      updateRef: mockUpdateRef,
    },
  })),
}));

import { publishFiles } from '@/lib/github';

describe('publishFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRef.mockResolvedValue({ data: { object: { sha: 'latest-commit-sha' } } });
    mockGetCommit.mockResolvedValue({ data: { tree: { sha: 'base-tree-sha' } } });
    mockCreateBlob.mockImplementation(async ({ content }: { content: string }) => ({
      data: { sha: `blob-sha-for-${content}` },
    }));
    mockCreateTree.mockResolvedValue({ data: { sha: 'new-tree-sha' } });
    mockCreateCommit.mockResolvedValue({ data: { sha: 'new-commit-sha' } });
    mockUpdateRef.mockResolvedValue({ data: {} });
  });

  it('throws if no token is provided or configured', async () => {
    await expect(publishFiles([], 'msg', '')).rejects.toThrow('CMS_GITHUB_TOKEN');
  });

  it('creates a blob for every upsert change and a null-sha entry for deletes', async () => {
    await publishFiles(
      [
        { path: 'content/site.json', action: 'upsert', content: 'ewogICJhIjogMQp9' },
        { path: 'public/images/old.jpg', action: 'delete' },
      ],
      'test commit',
      'fake-token'
    );

    expect(mockCreateBlob).toHaveBeenCalledTimes(1);
    expect(mockCreateBlob).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'ewogICJhIjogMQp9', encoding: 'base64' })
    );
    expect(mockCreateTree).toHaveBeenCalledWith(
      expect.objectContaining({
        base_tree: 'base-tree-sha',
        tree: [
          expect.objectContaining({
            path: 'content/site.json',
            sha: 'blob-sha-for-ewogICJhIjogMQp9',
          }),
          expect.objectContaining({ path: 'public/images/old.jpg', sha: null }),
        ],
      })
    );
  });

  it('creates one commit on top of the latest commit and updates main', async () => {
    const result = await publishFiles(
      [{ path: 'content/site.json', action: 'upsert', content: 'ZGF0YQ==' }],
      'test commit',
      'fake-token'
    );

    expect(mockCreateCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'test commit',
        tree: 'new-tree-sha',
        parents: ['latest-commit-sha'],
      })
    );
    expect(mockUpdateRef).toHaveBeenCalledWith(
      expect.objectContaining({ ref: 'heads/main', sha: 'new-commit-sha' })
    );
    expect(result).toEqual({ commitSha: 'new-commit-sha' });
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run lib/github.test.ts`
Expected: FAIL — `lib/github.ts` doesn't exist yet.

- [ ] **Step 4: Write `lib/github.ts`**

```typescript
import { Octokit } from '@octokit/rest';

const OWNER = 'craiglawsonnn';
const REPO = 'CAB';
const BRANCH = 'main';

export interface FileChange {
  path: string;
  action: 'upsert' | 'delete';
  content?: string;
}

export async function publishFiles(
  changes: FileChange[],
  commitMessage: string,
  token: string = process.env.CMS_GITHUB_TOKEN ?? ''
): Promise<{ commitSha: string }> {
  if (!token) {
    throw new Error('CMS_GITHUB_TOKEN is not configured.');
  }

  const octokit = new Octokit({ auth: token });

  const { data: refData } = await octokit.git.getRef({
    owner: OWNER,
    repo: REPO,
    ref: `heads/${BRANCH}`,
  });
  const latestCommitSha = refData.object.sha;

  const { data: latestCommit } = await octokit.git.getCommit({
    owner: OWNER,
    repo: REPO,
    commit_sha: latestCommitSha,
  });
  const baseTreeSha = latestCommit.tree.sha;

  const treeEntries = await Promise.all(
    changes.map(async (change) => {
      if (change.action === 'delete') {
        return { path: change.path, mode: '100644' as const, type: 'blob' as const, sha: null };
      }
      const { data: blob } = await octokit.git.createBlob({
        owner: OWNER,
        repo: REPO,
        content: change.content ?? '',
        encoding: 'base64',
      });
      return { path: change.path, mode: '100644' as const, type: 'blob' as const, sha: blob.sha };
    })
  );

  const { data: newTree } = await octokit.git.createTree({
    owner: OWNER,
    repo: REPO,
    base_tree: baseTreeSha,
    tree: treeEntries,
  });

  const { data: newCommit } = await octokit.git.createCommit({
    owner: OWNER,
    repo: REPO,
    message: commitMessage,
    tree: newTree.sha,
    parents: [latestCommitSha],
  });

  await octokit.git.updateRef({
    owner: OWNER,
    repo: REPO,
    ref: `heads/${BRANCH}`,
    sha: newCommit.sha,
  });

  return { commitSha: newCommit.sha };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run lib/github.test.ts`
Expected: all PASS.

- [ ] **Step 6: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/github.ts lib/github.test.ts package.json package-lock.json
git commit -m "feat: add GitHub publish client (atomic commit via Git Data API)"
```

---

### Task 8: Server-side image compression (`lib/processImage.ts`)

**Files:**
- Create: `lib/processImage.ts`
- Create: `lib/processImage.test.ts`

**Interfaces:**
- Produces: `processImage(base64Input: string, maxWidth: number): Promise<string>` (returns a base64-encoded, resized, JPEG-compressed image) — consumed by Task 9's save route.

- [ ] **Step 1: Write the failing test**

```typescript
// lib/processImage.test.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { processImage } from '@/lib/processImage';

async function makeTestImageBase64(width: number, height: number): Promise<string> {
  const buffer = await sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 50, b: 50 } },
  })
    .jpeg()
    .toBuffer();
  return buffer.toString('base64');
}

describe('processImage', () => {
  it('resizes an image down to the given max width', async () => {
    const input = await makeTestImageBase64(200, 100);
    const outputBase64 = await processImage(input, 50);
    const metadata = await sharp(Buffer.from(outputBase64, 'base64')).metadata();
    expect(metadata.width).toBeLessThanOrEqual(50);
  });

  it('does not enlarge an image already smaller than the max width', async () => {
    const input = await makeTestImageBase64(30, 20);
    const outputBase64 = await processImage(input, 50);
    const metadata = await sharp(Buffer.from(outputBase64, 'base64')).metadata();
    expect(metadata.width).toBe(30);
  });

  it('outputs JPEG', async () => {
    const input = await makeTestImageBase64(100, 100);
    const outputBase64 = await processImage(input, 50);
    const metadata = await sharp(Buffer.from(outputBase64, 'base64')).metadata();
    expect(metadata.format).toBe('jpeg');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/processImage.test.ts`
Expected: FAIL — `lib/processImage.ts` doesn't exist yet.

- [ ] **Step 3: Write `lib/processImage.ts`**

```typescript
import sharp from 'sharp';

export async function processImage(base64Input: string, maxWidth: number): Promise<string> {
  const inputBuffer = Buffer.from(base64Input, 'base64');
  const outputBuffer = await sharp(inputBuffer)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();
  return outputBuffer.toString('base64');
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/processImage.test.ts`
Expected: all PASS.

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/processImage.ts lib/processImage.test.ts
git commit -m "feat: add server-side image compression for uploads"
```

---

### Task 9: `/api/admin/save` route, final verification, and Vercel environment variables

**Files:**
- Create: `app/api/admin/save/route.ts`
- Create: `app/api/admin/save/route.test.ts`

**Interfaces:**
- Consumes: `processImage` (Task 8), `publishFiles`/`FileChange` (Task 7). Protected by the middleware from Task 5 (this route is never called unauthenticated in production, but the route itself has no auth logic of its own — that's the middleware's job).
- Produces: `POST /api/admin/save` (body `{ content: object; images: Array<{ path: string; action: 'upsert' | 'delete'; base64?: string }> }`) — this is the endpoint a follow-up plan's admin dashboard calls on "Save & Publish".

- [ ] **Step 1: Write the failing tests**

```typescript
// app/api/admin/save/route.test.ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockProcessImage = vi.fn();
const mockPublishFiles = vi.fn();

vi.mock('@/lib/processImage', () => ({ processImage: mockProcessImage }));
vi.mock('@/lib/github', () => ({ publishFiles: mockPublishFiles }));

import { POST } from './route';

const VALID_CONTENT = {
  seo: {}, businessName: 'x', phoneDisplay: 'x', phoneHref: 'x', instagramDmUrl: null,
  instagramPendingLabel: 'x', logoSrc: 'x', heroImageSrc: 'x', nav: {}, hero: {},
  beforeAfter: {}, gallery: {}, reels: {}, googleReview: {}, pricing: {}, contact: {}, footer: {},
};

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/admin/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessImage.mockResolvedValue('compressed-base64');
    mockPublishFiles.mockResolvedValue({ commitSha: 'abc123' });
  });

  it('rejects a payload missing required content keys without calling GitHub', async () => {
    const response = await POST(makeRequest({ content: { businessName: 'x' }, images: [] }));
    expect(response.status).toBe(400);
    expect(mockPublishFiles).not.toHaveBeenCalled();
  });

  it('rejects an image path outside public/images/', async () => {
    const response = await POST(
      makeRequest({
        content: VALID_CONTENT,
        images: [{ path: 'lib/evil.ts', action: 'upsert', base64: 'ZGF0YQ==' }],
      })
    );
    expect(response.status).toBe(400);
    expect(mockPublishFiles).not.toHaveBeenCalled();
  });

  it('rejects an oversized image', async () => {
    const oversized = Buffer.alloc(9 * 1024 * 1024).toString('base64');
    const response = await POST(
      makeRequest({
        content: VALID_CONTENT,
        images: [{ path: 'public/images/big.jpg', action: 'upsert', base64: oversized }],
      })
    );
    expect(response.status).toBe(400);
    expect(mockPublishFiles).not.toHaveBeenCalled();
  });

  it('compresses upsert images and publishes content + images in one call', async () => {
    const response = await POST(
      makeRequest({
        content: VALID_CONTENT,
        images: [
          { path: 'public/images/new.jpg', action: 'upsert', base64: 'ZGF0YQ==' },
          { path: 'public/images/old.jpg', action: 'delete' },
        ],
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, commitSha: 'abc123' });

    expect(mockProcessImage).toHaveBeenCalledWith('ZGF0YQ==', 2000);
    expect(mockPublishFiles).toHaveBeenCalledTimes(1);
    const [changes] = mockPublishFiles.mock.calls[0];
    expect(changes).toEqual(
      expect.arrayContaining([
        { path: 'public/images/new.jpg', action: 'upsert', content: 'compressed-base64' },
        { path: 'public/images/old.jpg', action: 'delete' },
        expect.objectContaining({ path: 'content/site.json', action: 'upsert' }),
      ])
    );
  });

  it('returns 502 when publishing fails', async () => {
    mockPublishFiles.mockRejectedValue(new Error('GitHub API error'));
    const response = await POST(makeRequest({ content: VALID_CONTENT, images: [] }));
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toBe('GitHub API error');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run app/api/admin/save/route.test.ts`
Expected: FAIL — `app/api/admin/save/route.ts` doesn't exist yet.

- [ ] **Step 3: Write `app/api/admin/save/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { processImage } from '@/lib/processImage';
import { publishFiles, type FileChange } from '@/lib/github';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES_PER_SAVE = 30;
const IMAGE_MAX_WIDTH = 2000;

const REQUIRED_CONTENT_KEYS = [
  'seo', 'businessName', 'phoneDisplay', 'phoneHref', 'instagramDmUrl',
  'instagramPendingLabel', 'logoSrc', 'heroImageSrc', 'nav', 'hero',
  'beforeAfter', 'gallery', 'reels', 'googleReview', 'pricing', 'contact', 'footer',
];

interface SaveImage {
  path: string;
  action: 'upsert' | 'delete';
  base64?: string;
}

interface ValidatedBody {
  content: Record<string, unknown>;
  images: SaveImage[];
}

function validateBody(body: unknown): ValidatedBody | null {
  if (typeof body !== 'object' || body === null) return null;
  const { content, images } = body as { content?: unknown; images?: unknown };

  if (typeof content !== 'object' || content === null) return null;
  for (const key of REQUIRED_CONTENT_KEYS) {
    if (!(key in content)) return null;
  }

  if (!Array.isArray(images)) return null;
  if (images.length > MAX_IMAGES_PER_SAVE) return null;

  for (const image of images) {
    if (typeof image?.path !== 'string' || !image.path.startsWith('public/images/')) return null;
    if (image.action !== 'upsert' && image.action !== 'delete') return null;
    if (image.action === 'upsert') {
      if (typeof image.base64 !== 'string') return null;
      const byteLength = Buffer.byteLength(image.base64, 'base64');
      if (byteLength === 0 || byteLength > MAX_IMAGE_BYTES) return null;
    }
  }

  return { content: content as Record<string, unknown>, images: images as SaveImage[] };
}

export async function POST(request: Request) {
  const rawBody = await request.json().catch(() => null);
  const validated = validateBody(rawBody);
  if (!validated) {
    return NextResponse.json({ ok: false, error: 'Invalid request payload.' }, { status: 400 });
  }

  const changes: FileChange[] = [];

  for (const image of validated.images) {
    if (image.action === 'delete') {
      changes.push({ path: image.path, action: 'delete' });
      continue;
    }
    const compressed = await processImage(image.base64 as string, IMAGE_MAX_WIDTH);
    changes.push({ path: image.path, action: 'upsert', content: compressed });
  }

  const contentJson = JSON.stringify(validated.content, null, 2);
  changes.push({
    path: 'content/site.json',
    action: 'upsert',
    content: Buffer.from(contentJson, 'utf-8').toString('base64'),
  });

  try {
    const { commitSha } = await publishFiles(changes, 'chore: publish content update from admin CMS');
    return NextResponse.json({ ok: true, commitSha });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Publish failed.';
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run app/api/admin/save/route.test.ts`
Expected: all PASS.

- [ ] **Step 5: Run the full suite, typecheck, and production build**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/save
git commit -m "feat: add /api/admin/save endpoint (validate, compress images, publish atomically)"
```

- [ ] **Step 7: Manual — set Vercel environment variables**

This step is done by the project owner in the Vercel dashboard, not by the implementer:

1. Generate the admin password hash locally: `npm run hash-password -- "the-chosen-admin-password"` — copy the printed hash.
2. Generate a session secret: any long random string works, e.g. run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and copy the output.
3. In the Vercel project's Settings → Environment Variables, add three variables (all environments — Production, Preview, Development):
   - `ADMIN_PASSWORD_HASH` — the hash from step 1.
   - `SESSION_SECRET` — the random string from step 2.
   - `CMS_GITHUB_TOKEN` — the fine-grained GitHub PAT generated earlier in this plan's Manual Setup.
4. Redeploy (Vercel prompts for this automatically after saving new env vars, or push any commit — this task's own commits will trigger it).
5. Smoke test: visit `https://cab-chi.vercel.app/admin` — should redirect to `/admin/login`. Log in with the chosen password — should redirect to `/admin` and show the stub dashboard. Click "Log out" — should return to the login page.

## Self-review notes

- **Spec coverage:** Implements spec section 1 (hosting migration — Task 1), section 3 (authentication — Tasks 2-6), and section 5 (publish flow — Tasks 7-9). Section 4 (admin UI) is explicitly out of scope, per the spec's own two-plan split.
- **Placeholder scan:** No TBDs; every step has complete, real code.
- **Type consistency:** `FileChange`, `SESSION_COOKIE_NAME`, `checkAndRecordAttempt`'s signature, and `processImage`'s signature are each defined once and reused verbatim by every later task that consumes them — cross-checked against each task's own "Consumes" line.
- **Scope check:** Single subsystem (hosting + auth + publish backend), ready to execute as one plan. The admin dashboard UI is the next plan.
