# CAB Premium Detailing Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the CAB Premium Detailing marketing site as a Next.js static-export app, matching the approved design spec.

**Architecture:** Single-page Next.js App Router site. All business content (phone, Instagram, Google review, before/after image pairs, reel embeds, pricing) lives in one typed config module (`content/site.ts`) that page-level composition threads down to presentational components via props — no component reads global config directly, so each is independently testable. Interactive behavior (before/after drag slider, sticky nav) is isolated into small client components backed by pure, unit-tested utility functions.

**Tech Stack:** Next.js (App Router) + TypeScript, CSS Modules + CSS custom-property design tokens, `next/font/google` (Fraunces + Karla), Vitest + React Testing Library, `sharp` for build-time image compression, static export (`output: 'export'`) deployed to GitHub Pages via GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-18-cab-detailing-website-design.md`

## Global Constraints

- Primary accent color: `#1D3ED1` (decisive cobalt blue) — used as solid fills/borders/CTAs, never as a diffuse same-hue gradient wash across the background.
- Background: a true neutral near-black/charcoal — must NOT be navy- or blue-tinted.
- Secondary accent: brushed-metal/chrome tone, used for badges/dividers/logo treatment.
- Display font: **Fraunces** (headlines, pricing numbers). Body/UI font: **Karla**. Never use Inter, Roboto, Arial, or system-default fonts.
- No fabricated review quotes anywhere in the UI — the reviews section is a link-out rating card only, and must degrade to a disabled/pending state (never a broken/fake link) when `profileUrl` is `null`.
- The reels section must never render a broken `iframe src="about:blank"` — show an explicit "coming soon" placeholder when `embedUrl` is `null`.
- Real confirmed phone number: `(406) 609-5321` / `tel:+14066095321`.
- Repo name is `CAB`, owned by GitHub account `craiglawsonnn` (already pushed at `github.com/craiglawsonnn/CAB`).
- Static export (`output: 'export'`) with `images.unoptimized: true` — GitHub Pages hosts static files only, no image-optimization server.
- All source photos live in `imgs/`; the app must never reference `imgs/` directly — only compressed copies under `public/images/` (produced by the image pipeline in Task 2).

---

## Task 1: Project Scaffolding & Design Tokens

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `next-env.d.ts`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `app/page.tsx`
- Create: `.gitignore`

**Interfaces:**
- Produces: CSS custom properties on `:root` (`--color-bg`, `--color-bg-elevated`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-accent-hover`, `--color-chrome-start`, `--color-chrome-mid`, `--color-chrome-end`, `--font-display`, `--font-body`, `--radius-card`, `--radius-btn`, `--container-max-width`) that every later component's CSS Module relies on.
- Produces: path alias `@/*` → project root, used by every later import.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "cab-detailing",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "prepare-images": "node scripts/prepare-images.mjs"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.7.0",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.2",
    "jsdom": "^25.0.1",
    "sharp": "^0.33.5",
    "typescript": "^5.6.3",
    "vitest": "^2.1.2"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: installs succeed, `node_modules/` and `package-lock.json` created.

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `next-env.d.ts`**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 5: Create `next.config.js`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
```

- [ ] **Step 6: Create `.gitignore`**

```
node_modules
.next
out
*.log
```

- [ ] **Step 7: Create `app/globals.css`**

```css
:root {
  --color-bg: #0b0a09;
  --color-bg-elevated: #15130f;
  --color-text: #f5f2ec;
  --color-text-muted: #a89f92;
  --color-accent: #1d3ed1;
  --color-accent-hover: #3452e0;
  --color-chrome-start: #e7e3da;
  --color-chrome-mid: #9a9488;
  --color-chrome-end: #c9c4b8;
  --font-display: var(--font-fraunces), Georgia, serif;
  --font-body: var(--font-karla), -apple-system, sans-serif;
  --radius-card: 16px;
  --radius-btn: 8px;
  --container-max-width: 1200px;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
}

h1,
h2,
h3 {
  font-family: var(--font-display);
  margin: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  max-width: 100%;
  display: block;
}
```

- [ ] **Step 8: Create `app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { Fraunces, Karla } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const karla = Karla({
  subsets: ['latin'],
  variable: '--font-karla',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CAB Premium Detailing | Cars, Airplanes & Boats',
  description:
    'Mobile premium detailing for cars, airplanes, and boats. Book via Instagram DM or call/text.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${karla.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 9: Create placeholder `app/page.tsx`**

```tsx
export default function Home() {
  return <main>CAB</main>;
}
```

- [ ] **Step 10: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 11: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 12: Verify the build**

Run: `npm run build`
Expected: build succeeds, `out/index.html` is created and contains `CAB`.

Verify with: `grep -q "CAB" out/index.html && echo OK`
Expected output: `OK`

- [ ] **Step 13: Verify the test runner works (no tests yet)**

Run: `npm run test`
Expected: `No test files found` (or similar) — exits without error since no `*.test.ts(x)` files exist yet.

- [ ] **Step 14: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.js next-env.d.ts vitest.config.ts vitest.setup.ts app .gitignore
git commit -m "chore: scaffold Next.js app with design tokens and test runner"
```

---

## Task 2: Image Asset Pipeline

**Files:**
- Create: `scripts/prepare-images.mjs`

**Interfaces:**
- Produces: compressed images under `public/images/` with the exact filenames listed in the manifest below — Task 3's `content/site.ts` references these exact paths.

- [ ] **Step 1: Create `scripts/prepare-images.mjs`**

```js
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const SOURCE_DIR = path.resolve('imgs');
const OUTPUT_DIR = path.resolve('public/images');

const MANIFEST = [
  { src: 'HeroAdvertImage.jpg', out: 'hero.jpg', maxWidth: 2000 },
  { src: 'CABLogo.jpg', out: 'logo.jpg', maxWidth: 400 },
  { src: 'DriverdoorBefore.jpg', out: 'driver-door-before.jpg', maxWidth: 1200 },
  { src: 'DriverdoorAfter.jpg', out: 'driver-door-after.jpg', maxWidth: 1200 },
  { src: 'PassengerBefore.jpg', out: 'passenger-before.jpg', maxWidth: 1200 },
  { src: 'PassengerAfter.jpg', out: 'passenger-after.jpg', maxWidth: 1200 },
  { src: 'BehindBefore.jpg', out: 'behind-seats-before.jpg', maxWidth: 1200 },
  { src: 'BehindAfter.jpg', out: 'behind-seats-after.jpg', maxWidth: 1200 },
  { src: 'Boot1Before.jpg', out: 'boot-1-before.jpg', maxWidth: 1200 },
  { src: 'Boot1After.jpg', out: 'boot-1-after.jpg', maxWidth: 1200 },
  { src: 'Boot2Before.jpg', out: 'boot-2-before.jpg', maxWidth: 1200 },
  { src: 'Boot2After.jpg', out: 'boot-2-after.jpg', maxWidth: 1200 },
  { src: 'CardoorBeforepng.png', out: 'car-door-before.jpg', maxWidth: 1200 },
  { src: 'CardoorAfter.png', out: 'car-door-after.jpg', maxWidth: 1200 },
  { src: 'Addons.jpg', out: 'addons.jpg', maxWidth: 1200 },
  { src: 'Prices.jpg', out: 'prices.jpg', maxWidth: 1200 },
  { src: 'HeadlightRestore.jpg', out: 'headlight-restore.jpg', maxWidth: 1200 },
  { src: 'Details.png', out: 'details.jpg', maxWidth: 1200 },
];

async function run() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  for (const { src, out, maxWidth } of MANIFEST) {
    const inputPath = path.join(SOURCE_DIR, src);
    const outputPath = path.join(OUTPUT_DIR, out);
    await sharp(inputPath)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toFile(outputPath);
    console.log(`Wrote ${outputPath}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
```

- [ ] **Step 2: Run the script**

Run: `npm run prepare-images`
Expected: 18 lines of `Wrote public/images/...` output, no errors.

- [ ] **Step 3: Verify every output file is under 500KB**

Run (bash):
```bash
for f in public/images/*; do
  size=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f")
  if [ "$size" -gt 512000 ]; then
    echo "TOO LARGE: $f ($size bytes)"
  fi
done
echo "check complete"
```
Expected output: only `check complete` — no `TOO LARGE` lines.

- [ ] **Step 4: Commit**

```bash
git add scripts/prepare-images.mjs public/images
git commit -m "feat: add build-time image compression pipeline"
```

Note: `public/images/` is generated output but is committed directly (no CI-only generation) since GitHub Pages serves whatever is in the deployed `out/` directory, and committing the compressed copies keeps local `npm run build` reproducible without requiring `prepare-images` to be re-run by every contributor. The CI workflow in Task 14 re-runs it anyway to keep it fresh if source photos change.

---

## Task 3: Content Config

**Files:**
- Create: `content/site.ts`
- Test: `content/site.test.ts`

**Interfaces:**
- Consumes: image paths produced by Task 2 (`public/images/*.jpg`).
- Produces: `siteConfig: SiteConfig` and types `SiteConfig`, `BeforeAfterPair`, `PricingItem`, `ReelItem`, `GoogleReviewConfig` — every component task from Task 5 onward imports these types and receives values derived from `siteConfig` as props from `app/page.tsx` (Task 13).

- [ ] **Step 1: Write the failing test**

```ts
// content/site.test.ts
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { siteConfig } from '@/content/site';

const PUBLIC_DIR = path.resolve('public');

function assertImageExists(publicPath: string) {
  const diskPath = path.join(PUBLIC_DIR, publicPath.replace(/^\//, ''));
  expect(existsSync(diskPath), `expected image at ${diskPath}`).toBe(true);
}

describe('siteConfig', () => {
  it('uses the real confirmed phone number', () => {
    expect(siteConfig.phoneDisplay).toBe('(406) 609-5321');
    expect(siteConfig.phoneHref).toBe('tel:+14066095321');
  });

  it('has exactly six before/after pairs, each with images on disk', () => {
    expect(siteConfig.beforeAfterPairs).toHaveLength(6);
    for (const pair of siteConfig.beforeAfterPairs) {
      assertImageExists(pair.beforeSrc);
      assertImageExists(pair.afterSrc);
    }
  });

  it('has exactly four pricing items', () => {
    expect(siteConfig.pricing).toHaveLength(4);
  });

  it('references pricing support images that exist on disk', () => {
    assertImageExists(siteConfig.pricingImages.addons);
    assertImageExists(siteConfig.pricingImages.prices);
    assertImageExists(siteConfig.pricingImages.headlight);
    assertImageExists(siteConfig.pricingImages.details);
  });

  it('references a logo and hero image that exist on disk', () => {
    assertImageExists(siteConfig.logoSrc);
    assertImageExists(siteConfig.heroImageSrc);
  });

  it('does not fabricate a Google review profile url', () => {
    expect(siteConfig.googleReview.profileUrl).toBeNull();
  });

  it('does not fabricate reel embed urls', () => {
    for (const reel of siteConfig.reels) {
      expect(reel.embedUrl).toBeNull();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run content/site.test.ts`
Expected: FAIL — `Cannot find module '@/content/site'` (file doesn't exist yet).

- [ ] **Step 3: Create `content/site.ts`**

```ts
export interface BeforeAfterPair {
  id: string;
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  caption: string;
}

export interface PricingItem {
  id: string;
  name: string;
  detail?: string;
  price: string;
}

export interface ReelItem {
  id: string;
  caption: string;
  embedUrl: string | null;
}

export interface GoogleReviewConfig {
  rating: number;
  reviewCount: number;
  profileUrl: string | null;
}

export interface SiteConfig {
  businessName: string;
  phoneDisplay: string;
  phoneHref: string;
  instagramDmUrl: string;
  logoSrc: string;
  heroImageSrc: string;
  googleReview: GoogleReviewConfig;
  beforeAfterPairs: BeforeAfterPair[];
  reels: ReelItem[];
  pricing: PricingItem[];
  pricingImages: {
    addons: string;
    prices: string;
    headlight: string;
    details: string;
  };
}

export const siteConfig: SiteConfig = {
  businessName: 'CAB Premium Detailing',
  phoneDisplay: '(406) 609-5321',
  phoneHref: 'tel:+14066095321',
  // Placeholder until the real Instagram handle is supplied.
  instagramDmUrl: 'https://instagram.com/direct/inbox/',
  logoSrc: '/images/logo.jpg',
  heroImageSrc: '/images/hero.jpg',
  googleReview: {
    rating: 4.9,
    reviewCount: 50,
    // Placeholder until the real Google Business Profile URL is supplied.
    profileUrl: null,
  },
  beforeAfterPairs: [
    {
      id: 'driver-door',
      beforeSrc: '/images/driver-door-before.jpg',
      afterSrc: '/images/driver-door-after.jpg',
      beforeAlt: 'Driver door interior before detailing',
      afterAlt: 'Driver door interior after detailing',
      caption: 'Driver Door: Leather & Trim Restoration',
    },
    {
      id: 'passenger',
      beforeSrc: '/images/passenger-before.jpg',
      afterSrc: '/images/passenger-after.jpg',
      beforeAlt: 'Passenger area before detailing',
      afterAlt: 'Passenger area after detailing',
      caption: 'Passenger Area: Full Interior Detail',
    },
    {
      id: 'behind-seats',
      beforeSrc: '/images/behind-seats-before.jpg',
      afterSrc: '/images/behind-seats-after.jpg',
      beforeAlt: 'Behind seats and floor mats before detailing',
      afterAlt: 'Behind seats and floor mats after detailing',
      caption: 'Deep Carpet Extraction & Floor Mat Care',
    },
    {
      id: 'boot-1',
      beforeSrc: '/images/boot-1-before.jpg',
      afterSrc: '/images/boot-1-after.jpg',
      beforeAlt: 'Trunk cargo area before detailing',
      afterAlt: 'Trunk cargo area after detailing',
      caption: 'Full Trunk & Cargo Bay Detail',
    },
    {
      id: 'boot-2',
      beforeSrc: '/images/boot-2-before.jpg',
      afterSrc: '/images/boot-2-after.jpg',
      beforeAlt: 'SUV cargo area before detailing',
      afterAlt: 'SUV cargo area after detailing',
      caption: 'SUV Cargo Bay Detail',
    },
    {
      id: 'car-door',
      beforeSrc: '/images/car-door-before.jpg',
      afterSrc: '/images/car-door-after.jpg',
      beforeAlt: 'Car door panel before detailing',
      afterAlt: 'Car door panel after detailing',
      caption: 'Door Panel Interior Restoration',
    },
  ],
  reels: [
    { id: 'reel-1', caption: 'Aircraft Exterior Ceramic Wash', embedUrl: null },
    { id: 'reel-2', caption: 'Yacht Teak & Hull Polish', embedUrl: null },
    { id: 'reel-3', caption: 'Full Supercar Paint Correction', embedUrl: null },
  ],
  pricing: [
    { id: 'headlight', name: 'Headlight Restoration', price: '$80–$120' },
    { id: 'pet-hair', name: 'Heavy Pet Hair Removal', price: 'From $40' },
    {
      id: 'ceramic-spray',
      name: 'Ceramic Spray Protection',
      detail: 'Lasts 3–6 months',
      price: '$60–$75',
    },
    { id: 'odor', name: 'Odor Elimination', detail: 'Ozone Treatment', price: '$50' },
  ],
  pricingImages: {
    addons: '/images/addons.jpg',
    prices: '/images/prices.jpg',
    headlight: '/images/headlight-restore.jpg',
    details: '/images/details.jpg',
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run content/site.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add content/site.ts content/site.test.ts
git commit -m "feat: add typed site content config"
```

---

## Task 4: Before/After Slider Math Utility

**Files:**
- Create: `lib/sliderMath.ts`
- Test: `lib/sliderMath.test.ts`

**Interfaces:**
- Produces: `clampPercent(value: number): number` and `percentFromClientX(clientX: number, rect: { left: number; width: number }): number` — consumed by `BeforeAfterSlider` (Task 7).

- [ ] **Step 1: Write the failing test**

```ts
// lib/sliderMath.test.ts
import { describe, it, expect } from 'vitest';
import { clampPercent, percentFromClientX } from '@/lib/sliderMath';

describe('clampPercent', () => {
  it('clamps values below 0 to 0', () => {
    expect(clampPercent(-10)).toBe(0);
  });

  it('clamps values above 100 to 100', () => {
    expect(clampPercent(150)).toBe(100);
  });

  it('passes through in-range values', () => {
    expect(clampPercent(42)).toBe(42);
  });
});

describe('percentFromClientX', () => {
  it('returns 0 at the left edge', () => {
    expect(percentFromClientX(0, { left: 0, width: 200 })).toBe(0);
  });

  it('returns 100 at the right edge', () => {
    expect(percentFromClientX(200, { left: 0, width: 200 })).toBe(100);
  });

  it('returns 50 at the midpoint', () => {
    expect(percentFromClientX(100, { left: 0, width: 200 })).toBe(50);
  });

  it('accounts for container offset', () => {
    expect(percentFromClientX(150, { left: 100, width: 200 })).toBe(25);
  });

  it('returns 50 when width is 0 to avoid divide-by-zero', () => {
    expect(percentFromClientX(50, { left: 0, width: 0 })).toBe(50);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/sliderMath.test.ts`
Expected: FAIL — `Cannot find module '@/lib/sliderMath'`.

- [ ] **Step 3: Create `lib/sliderMath.ts`**

```ts
export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function percentFromClientX(
  clientX: number,
  rect: { left: number; width: number }
): number {
  if (rect.width === 0) return 50;
  const raw = ((clientX - rect.left) / rect.width) * 100;
  return clampPercent(raw);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/sliderMath.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/sliderMath.ts lib/sliderMath.test.ts
git commit -m "feat: add before/after slider position math"
```

---

## Task 5: Nav Component

**Files:**
- Create: `components/Nav.tsx`
- Create: `components/Nav.module.css`
- Test: `components/Nav.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks (pure props component).
- Produces: `NavProps { phoneDisplay: string; phoneHref: string; instagramDmUrl: string; logoSrc: string; businessName: string }`, default export `Nav`. Consumed by `app/page.tsx` (Task 13).

- [ ] **Step 1: Write the failing test**

```tsx
// components/Nav.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Nav from '@/components/Nav';

const props = {
  phoneDisplay: '(406) 609-5321',
  phoneHref: 'tel:+14066095321',
  instagramDmUrl: 'https://instagram.com/direct/inbox/',
  logoSrc: '/images/logo.jpg',
  businessName: 'CAB Premium Detailing',
};

describe('Nav', () => {
  it('renders a Call Now link using the phoneHref prop', () => {
    render(<Nav {...props} />);
    expect(screen.getByRole('link', { name: 'Call Now' })).toHaveAttribute(
      'href',
      props.phoneHref
    );
  });

  it('renders a DM on Instagram link using the instagramDmUrl prop', () => {
    render(<Nav {...props} />);
    expect(screen.getByRole('link', { name: 'DM on Instagram' })).toHaveAttribute(
      'href',
      props.instagramDmUrl
    );
  });

  it('renders all five anchor nav links', () => {
    render(<Nav {...props} />);
    const expected = ['Services', 'Before & After', 'Reels', 'Reviews', 'Contact'];
    for (const label of expected) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('renders the logo with the business name as alt text', () => {
    render(<Nav {...props} />);
    expect(screen.getByAltText(`${props.businessName} logo`)).toHaveAttribute(
      'src',
      props.logoSrc
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/Nav.test.tsx`
Expected: FAIL — `Cannot find module '@/components/Nav'`.

- [ ] **Step 3: Create `components/Nav.module.css`**

```css
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: transparent;
  transition: background-color 200ms ease, border-color 200ms ease;
  border-bottom: 1px solid transparent;
}

.scrolled {
  background-color: rgba(11, 10, 9, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-chrome-mid);
}

.inner {
  max-width: var(--container-max-width);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 12px 24px;
}

.brand {
  display: flex;
  align-items: center;
}

.logo {
  height: 40px;
  width: auto;
  border-radius: 6px;
}

.links {
  display: flex;
  gap: 24px;
  font-family: var(--font-body);
  font-size: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.links a {
  color: var(--color-text-muted);
}

.links a:hover {
  color: var(--color-text);
}

.cta {
  display: flex;
  gap: 12px;
}

.btnOutline {
  border: 1px solid var(--color-chrome-mid);
  color: var(--color-text);
  padding: 8px 16px;
  border-radius: var(--radius-btn);
  font-size: 14px;
}

.btnAccent {
  background-color: var(--color-accent);
  color: #ffffff;
  padding: 8px 16px;
  border-radius: var(--radius-btn);
  font-size: 14px;
}

.btnAccent:hover {
  box-shadow: 0 0 24px rgba(29, 62, 209, 0.55);
}

@media (max-width: 768px) {
  .links {
    display: none;
  }
}
```

- [ ] **Step 4: Create `components/Nav.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import styles from './Nav.module.css';

export interface NavProps {
  phoneDisplay: string;
  phoneHref: string;
  instagramDmUrl: string;
  logoSrc: string;
  businessName: string;
}

const NAV_LINKS = [
  { href: '#services', label: 'Services' },
  { href: '#portfolio', label: 'Before & After' },
  { href: '#social-showcase', label: 'Reels' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#contact', label: 'Contact' },
];

export default function Nav({
  phoneDisplay,
  phoneHref,
  instagramDmUrl,
  logoSrc,
  businessName,
}: NavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <a href="#hero" className={styles.brand}>
          <img src={logoSrc} alt={`${businessName} logo`} className={styles.logo} />
        </a>
        <nav className={styles.links}>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className={styles.cta}>
          <a href={phoneHref} className={styles.btnOutline}>
            Call Now
          </a>
          <a href={instagramDmUrl} className={styles.btnAccent}>
            DM on Instagram
          </a>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/Nav.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add components/Nav.tsx components/Nav.module.css components/Nav.test.tsx
git commit -m "feat: add sticky Nav component"
```

---

## Task 6: Hero Component

**Files:**
- Create: `components/Hero.tsx`
- Create: `components/Hero.module.css`
- Test: `components/Hero.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks (pure props component).
- Produces: `HeroProps { heroImageSrc: string; phoneDisplay: string; phoneHref: string; instagramDmUrl: string }`, default export `Hero`. Consumed by `app/page.tsx` (Task 13).

- [ ] **Step 1: Write the failing test**

```tsx
// components/Hero.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Hero from '@/components/Hero';

const props = {
  heroImageSrc: '/images/hero.jpg',
  phoneDisplay: '(406) 609-5321',
  phoneHref: 'tel:+14066095321',
  instagramDmUrl: 'https://instagram.com/direct/inbox/',
};

describe('Hero', () => {
  it('renders the headline', () => {
    render(<Hero {...props} />);
    expect(
      screen.getByRole('heading', { name: /premium detailing for cars, airplanes/i })
    ).toBeInTheDocument();
  });

  it('renders a DM CTA linking to instagramDmUrl', () => {
    render(<Hero {...props} />);
    expect(screen.getByRole('link', { name: /book via instagram dm/i })).toHaveAttribute(
      'href',
      props.instagramDmUrl
    );
  });

  it('renders a call CTA linking to phoneHref and showing phoneDisplay', () => {
    render(<Hero {...props} />);
    const link = screen.getByRole('link', { name: new RegExp(props.phoneDisplay.replace(/[()]/g, '\\$&')) });
    expect(link).toHaveAttribute('href', props.phoneHref);
  });

  it('sets the section id to hero', () => {
    render(<Hero {...props} />);
    expect(document.getElementById('hero')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/Hero.test.tsx`
Expected: FAIL — `Cannot find module '@/components/Hero'`.

- [ ] **Step 3: Create `components/Hero.module.css`**

```css
.hero {
  position: relative;
  min-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.backgroundImage {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(11, 10, 9, 0.55) 0%, rgba(11, 10, 9, 0.92) 100%);
}

.glow {
  position: absolute;
  top: 20%;
  left: 50%;
  width: 60vw;
  height: 60vw;
  max-width: 800px;
  max-height: 800px;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(29, 62, 209, 0.35) 0%, rgba(29, 62, 209, 0) 70%);
  pointer-events: none;
}

.content {
  position: relative;
  z-index: 1;
  max-width: 760px;
  margin: 0 auto;
  padding: 0 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.reveal {
  opacity: 0;
  transform: translateY(16px);
  animation: reveal 600ms ease forwards;
}

@keyframes reveal {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.badge {
  border: 1px solid var(--color-chrome-mid);
  border-radius: 999px;
  padding: 6px 16px;
  font-size: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-chrome-start);
}

.content h1 {
  font-size: clamp(2.25rem, 5vw, 3.75rem);
  line-height: 1.05;
}

.subtitle {
  color: var(--color-text-muted);
  font-size: 1.125rem;
  max-width: 560px;
}

.actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.btnPrimary {
  background-color: var(--color-accent);
  color: #ffffff;
  padding: 14px 28px;
  border-radius: var(--radius-btn);
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(29, 62, 209, 0.35);
}

.btnPrimary:hover {
  box-shadow: 0 0 32px rgba(29, 62, 209, 0.6);
}

.btnSecondary {
  border: 1px solid var(--color-chrome-mid);
  color: var(--color-text);
  padding: 14px 28px;
  border-radius: var(--radius-btn);
  font-weight: 600;
}

@media (max-width: 640px) {
  .actions {
    flex-direction: column;
    width: 100%;
  }
}
```

- [ ] **Step 4: Create `components/Hero.tsx`**

```tsx
import styles from './Hero.module.css';

export interface HeroProps {
  heroImageSrc: string;
  phoneDisplay: string;
  phoneHref: string;
  instagramDmUrl: string;
}

export default function Hero({
  heroImageSrc,
  phoneDisplay,
  phoneHref,
  instagramDmUrl,
}: HeroProps) {
  return (
    <section id="hero" className={styles.hero}>
      <img src={heroImageSrc} alt="" className={styles.backgroundImage} aria-hidden="true" />
      <div className={styles.scrim} />
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.content}>
        <span className={`${styles.reveal} ${styles.badge}`} style={{ animationDelay: '0ms' }}>
          Mobile & Premium Service
        </span>
        <h1 className={styles.reveal} style={{ animationDelay: '120ms' }}>
          Premium Detailing for Cars, Airplanes &amp; Boats
        </h1>
        <p className={`${styles.reveal} ${styles.subtitle}`} style={{ animationDelay: '240ms' }}>
          Mobile service. Unmatched quality. Restoring high-end vehicles to showroom perfection.
        </p>
        <div className={`${styles.reveal} ${styles.actions}`} style={{ animationDelay: '360ms' }}>
          <a href={instagramDmUrl} className={styles.btnPrimary}>
            Book via Instagram DM
          </a>
          <a href={phoneHref} className={styles.btnSecondary}>
            Call / Text {phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/Hero.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add components/Hero.tsx components/Hero.module.css components/Hero.test.tsx
git commit -m "feat: add Hero component with staggered reveal"
```

---

## Task 7: BeforeAfterSlider Component

**Files:**
- Create: `components/BeforeAfterSlider.tsx`
- Create: `components/BeforeAfterSlider.module.css`
- Test: `components/BeforeAfterSlider.test.tsx`

**Interfaces:**
- Consumes: `BeforeAfterPair` type (Task 3), `clampPercent`/`percentFromClientX` (Task 4).
- Produces: `BeforeAfterSliderProps { pair: BeforeAfterPair }`, default export `BeforeAfterSlider`, with a `role="slider"` element exposing `aria-valuenow`. Consumed by `BeforeAfterSection` (Task 8).

- [ ] **Step 1: Write the failing test**

```tsx
// components/BeforeAfterSlider.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';

const pair = {
  id: 'test-pair',
  beforeSrc: '/images/test-before.jpg',
  afterSrc: '/images/test-after.jpg',
  beforeAlt: 'Before test',
  afterAlt: 'After test',
  caption: 'Test caption',
};

describe('BeforeAfterSlider', () => {
  it('renders the caption and before/after tags', () => {
    render(<BeforeAfterSlider pair={pair} />);
    expect(screen.getByText('Test caption')).toBeInTheDocument();
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });

  it('starts at the 50% position', () => {
    render(<BeforeAfterSlider pair={pair} />);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '50');
  });

  it('moves right on ArrowRight and left on ArrowLeft', async () => {
    const user = userEvent.setup();
    render(<BeforeAfterSlider pair={pair} />);
    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '55');
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(slider).toHaveAttribute('aria-valuenow', '45');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/BeforeAfterSlider.test.tsx`
Expected: FAIL — `Cannot find module '@/components/BeforeAfterSlider'`.

- [ ] **Step 3: Create `components/BeforeAfterSlider.module.css`**

```css
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.container {
  position: relative;
  aspect-ratio: 4 / 3;
  width: 100%;
  border-radius: var(--radius-card);
  overflow: hidden;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-chrome-mid);
  cursor: ew-resize;
  touch-action: pan-y;
}

.imageAfter {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.beforeClip {
  position: absolute;
  inset: 0;
  overflow: hidden;
  height: 100%;
}

.imageBefore {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: auto;
  max-width: none;
  object-fit: cover;
}

.tagBefore,
.tagAfter {
  position: absolute;
  top: 12px;
  padding: 4px 10px;
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border-radius: 999px;
  background-color: rgba(11, 10, 9, 0.75);
  color: var(--color-text);
}

.tagBefore {
  left: 12px;
}

.tagAfter {
  right: 12px;
}

.handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: var(--color-accent);
  transform: translateX(-50%);
}

.handle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 32px;
  height: 32px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background-color: var(--color-accent);
  box-shadow: 0 0 0 4px rgba(29, 62, 209, 0.25);
}

.caption {
  color: var(--color-text-muted);
  font-size: 14px;
}
```

- [ ] **Step 4: Create `components/BeforeAfterSlider.tsx`**

```tsx
'use client';

import { useCallback, useRef, useState } from 'react';
import type { BeforeAfterPair } from '@/content/site';
import { clampPercent, percentFromClientX } from '@/lib/sliderMath';
import styles from './BeforeAfterSlider.module.css';

export interface BeforeAfterSliderProps {
  pair: BeforeAfterPair;
}

export default function BeforeAfterSlider({ pair }: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [percent, setPercent] = useState(50);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPercent(percentFromClientX(clientX, rect));
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    updateFromClientX(event.clientX);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    updateFromClientX(event.clientX);
  };

  const handlePointerUp = () => {
    draggingRef.current = false;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setPercent((p) => clampPercent(p - 5));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setPercent((p) => clampPercent(p + 5));
    }
  };

  return (
    <div className={styles.wrapper}>
      <div
        ref={containerRef}
        className={styles.container}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <img src={pair.afterSrc} alt={pair.afterAlt} className={styles.imageAfter} />
        <div className={styles.beforeClip} style={{ width: `${percent}%` }}>
          <img src={pair.beforeSrc} alt={pair.beforeAlt} className={styles.imageBefore} />
        </div>
        <span className={styles.tagBefore}>Before</span>
        <span className={styles.tagAfter}>After</span>
        <div
          className={styles.handle}
          style={{ left: `${percent}%` }}
          role="slider"
          aria-label={`Before and after comparison: ${pair.caption}`}
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        />
      </div>
      <p className={styles.caption}>{pair.caption}</p>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/BeforeAfterSlider.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add components/BeforeAfterSlider.tsx components/BeforeAfterSlider.module.css components/BeforeAfterSlider.test.tsx
git commit -m "feat: add draggable, keyboard-accessible before/after slider"
```

---

## Task 8: BeforeAfterSection Component

**Files:**
- Create: `components/BeforeAfterSection.tsx`
- Create: `components/BeforeAfterSection.module.css`
- Test: `components/BeforeAfterSection.test.tsx`

**Interfaces:**
- Consumes: `BeforeAfterPair` type (Task 3), `BeforeAfterSlider` (Task 7).
- Produces: `BeforeAfterSectionProps { pairs: BeforeAfterPair[] }`, default export `BeforeAfterSection`, section id `portfolio`. Consumed by `app/page.tsx` (Task 13).

- [ ] **Step 1: Write the failing test**

```tsx
// components/BeforeAfterSection.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BeforeAfterSection from '@/components/BeforeAfterSection';
import { siteConfig } from '@/content/site';

describe('BeforeAfterSection', () => {
  it('renders one slider per pair', () => {
    render(<BeforeAfterSection pairs={siteConfig.beforeAfterPairs} />);
    expect(screen.getAllByRole('slider')).toHaveLength(siteConfig.beforeAfterPairs.length);
  });

  it('sets the section id to portfolio', () => {
    render(<BeforeAfterSection pairs={siteConfig.beforeAfterPairs} />);
    expect(document.getElementById('portfolio')).not.toBeNull();
  });

  it('renders every pair caption', () => {
    render(<BeforeAfterSection pairs={siteConfig.beforeAfterPairs} />);
    for (const pair of siteConfig.beforeAfterPairs) {
      expect(screen.getByText(pair.caption)).toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/BeforeAfterSection.test.tsx`
Expected: FAIL — `Cannot find module '@/components/BeforeAfterSection'`.

- [ ] **Step 3: Create `components/BeforeAfterSection.module.css`**

```css
.section {
  padding: 96px 24px;
}

.inner {
  max-width: var(--container-max-width);
  margin: 0 auto;
  text-align: center;
}

.subtitle {
  color: var(--color-text-muted);
  margin-top: 8px;
}

.grid {
  margin-top: 48px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
  text-align: left;
}
```

- [ ] **Step 4: Create `components/BeforeAfterSection.tsx`**

```tsx
import type { BeforeAfterPair } from '@/content/site';
import BeforeAfterSlider from './BeforeAfterSlider';
import styles from './BeforeAfterSection.module.css';

export interface BeforeAfterSectionProps {
  pairs: BeforeAfterPair[];
}

export default function BeforeAfterSection({ pairs }: BeforeAfterSectionProps) {
  return (
    <section id="portfolio" className={styles.section}>
      <div className={styles.inner}>
        <h2>Our Work: Before &amp; After</h2>
        <p className={styles.subtitle}>Drag the divider to see the transformation</p>
        <div className={styles.grid}>
          {pairs.map((pair) => (
            <BeforeAfterSlider key={pair.id} pair={pair} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/BeforeAfterSection.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add components/BeforeAfterSection.tsx components/BeforeAfterSection.module.css components/BeforeAfterSection.test.tsx
git commit -m "feat: add BeforeAfterSection composing sliders from config"
```

---

## Task 9: Reels Section (Platform Detection + Embed + Placeholder)

**Files:**
- Create: `lib/reelPlatform.ts`
- Test: `lib/reelPlatform.test.ts`
- Create: `components/ReelEmbed.tsx`
- Create: `components/ReelEmbed.module.css`
- Test: `components/ReelEmbed.test.tsx`
- Create: `components/ReelsSection.tsx`
- Create: `components/ReelsSection.module.css`
- Test: `components/ReelsSection.test.tsx`

**Interfaces:**
- Consumes: `ReelItem` type (Task 3).
- Produces: `detectPlatform(url: string): 'instagram' | 'tiktok' | 'unknown'` (used by `ReelEmbed`); `ReelEmbedProps { reel: ReelItem }` default export `ReelEmbed`; `ReelsSectionProps { reels: ReelItem[] }` default export `ReelsSection`, section id `social-showcase`. Consumed by `app/page.tsx` (Task 13).

- [ ] **Step 1: Write the failing test for platform detection**

```ts
// lib/reelPlatform.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/reelPlatform.test.ts`
Expected: FAIL — `Cannot find module '@/lib/reelPlatform'`.

- [ ] **Step 3: Create `lib/reelPlatform.ts`**

```ts
export type ReelPlatform = 'instagram' | 'tiktok' | 'unknown';

export function detectPlatform(url: string): ReelPlatform {
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  return 'unknown';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/reelPlatform.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing test for ReelEmbed**

```tsx
// components/ReelEmbed.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReelEmbed from '@/components/ReelEmbed';

describe('ReelEmbed', () => {
  it('renders a coming-soon placeholder when embedUrl is null', () => {
    render(<ReelEmbed reel={{ id: 'r1', caption: 'Aircraft wash', embedUrl: null }} />);
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
    expect(screen.getByText('Aircraft wash')).toBeInTheDocument();
  });

  it('renders an instagram blockquote embed when given an instagram url', () => {
    render(
      <ReelEmbed
        reel={{
          id: 'r2',
          caption: 'Yacht polish',
          embedUrl: 'https://www.instagram.com/reel/xyz/',
        }}
      />
    );
    const blockquote = document.querySelector('blockquote.instagram-media');
    expect(blockquote).not.toBeNull();
    expect(blockquote).toHaveAttribute(
      'data-instgrm-permalink',
      'https://www.instagram.com/reel/xyz/'
    );
  });

  it('renders a tiktok blockquote embed when given a tiktok url', () => {
    render(
      <ReelEmbed
        reel={{
          id: 'r3',
          caption: 'Paint correction',
          embedUrl: 'https://www.tiktok.com/@cab/video/123',
        }}
      />
    );
    const blockquote = document.querySelector('blockquote.tiktok-embed');
    expect(blockquote).not.toBeNull();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run components/ReelEmbed.test.tsx`
Expected: FAIL — `Cannot find module '@/components/ReelEmbed'`.

- [ ] **Step 7: Create `components/ReelEmbed.module.css`**

```css
.embed {
  width: 100%;
  height: 100%;
}

.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
  color: var(--color-text-muted);
}

.playIcon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--color-chrome-mid);
  color: var(--color-text);
}

.comingSoon {
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.fallbackLink {
  color: var(--color-accent);
  text-decoration: underline;
}
```

- [ ] **Step 8: Create `components/ReelEmbed.tsx`**

```tsx
'use client';

import { useEffect } from 'react';
import type { ReelItem } from '@/content/site';
import { detectPlatform } from '@/lib/reelPlatform';
import styles from './ReelEmbed.module.css';

export interface ReelEmbedProps {
  reel: ReelItem;
}

const EMBED_SCRIPTS: Record<'instagram' | 'tiktok', string> = {
  instagram: 'https://www.instagram.com/embed.js',
  tiktok: 'https://www.tiktok.com/embed.js',
};

export default function ReelEmbed({ reel }: ReelEmbedProps) {
  const platform = reel.embedUrl ? detectPlatform(reel.embedUrl) : null;

  useEffect(() => {
    if (!platform || platform === 'unknown') return;
    const scriptSrc = EMBED_SCRIPTS[platform];
    const existing = document.querySelector(`script[src="${scriptSrc}"]`);
    if (existing) {
      const instgrm = (window as unknown as { instgrm?: { Embeds?: { process?: () => void } } })
        .instgrm;
      instgrm?.Embeds?.process?.();
      return;
    }
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    document.body.appendChild(script);
  }, [platform]);

  if (!reel.embedUrl || !platform) {
    return (
      <div className={styles.placeholder}>
        <span className={styles.playIcon}>▶</span>
        <p>{reel.caption}</p>
        <span className={styles.comingSoon}>Coming soon</span>
      </div>
    );
  }

  if (platform === 'instagram') {
    return (
      <div className={styles.embed}>
        <blockquote className="instagram-media" data-instgrm-permalink={reel.embedUrl} />
      </div>
    );
  }

  if (platform === 'tiktok') {
    return (
      <div className={styles.embed}>
        <blockquote className="tiktok-embed" cite={reel.embedUrl}>
          <a href={reel.embedUrl}>{reel.caption}</a>
        </blockquote>
      </div>
    );
  }

  return (
    <div className={styles.embed}>
      <a href={reel.embedUrl} className={styles.fallbackLink}>
        {reel.caption}
      </a>
    </div>
  );
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npx vitest run components/ReelEmbed.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 10: Write the failing test for ReelsSection**

```tsx
// components/ReelsSection.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReelsSection from '@/components/ReelsSection';
import { siteConfig } from '@/content/site';

describe('ReelsSection', () => {
  it('renders one frame per reel', () => {
    render(<ReelsSection reels={siteConfig.reels} />);
    expect(screen.getAllByText('Coming soon')).toHaveLength(siteConfig.reels.length);
  });

  it('sets the section id to social-showcase', () => {
    render(<ReelsSection reels={siteConfig.reels} />);
    expect(document.getElementById('social-showcase')).not.toBeNull();
  });
});
```

- [ ] **Step 11: Run test to verify it fails**

Run: `npx vitest run components/ReelsSection.test.tsx`
Expected: FAIL — `Cannot find module '@/components/ReelsSection'`.

- [ ] **Step 12: Create `components/ReelsSection.module.css`**

```css
.section {
  padding: 96px 24px;
}

.inner {
  max-width: var(--container-max-width);
  margin: 0 auto;
  text-align: center;
}

.subtitle {
  color: var(--color-text-muted);
  margin-top: 8px;
}

.grid {
  margin-top: 48px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  justify-items: center;
}

.frame {
  aspect-ratio: 9 / 16;
  width: 100%;
  max-width: 320px;
  border-radius: var(--radius-card);
  overflow: hidden;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-chrome-mid);
}
```

- [ ] **Step 13: Create `components/ReelsSection.tsx`**

```tsx
import type { ReelItem } from '@/content/site';
import ReelEmbed from './ReelEmbed';
import styles from './ReelsSection.module.css';

export interface ReelsSectionProps {
  reels: ReelItem[];
}

export default function ReelsSection({ reels }: ReelsSectionProps) {
  return (
    <section id="social-showcase" className={styles.section}>
      <div className={styles.inner}>
        <h2>Video Showcase</h2>
        <p className={styles.subtitle}>Watch our process in action on TikTok &amp; Instagram</p>
        <div className={styles.grid}>
          {reels.map((reel) => (
            <div key={reel.id} className={styles.frame}>
              <ReelEmbed reel={reel} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 14: Run test to verify it passes**

Run: `npx vitest run components/ReelsSection.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 15: Commit**

```bash
git add lib/reelPlatform.ts lib/reelPlatform.test.ts components/ReelEmbed.tsx components/ReelEmbed.module.css components/ReelEmbed.test.tsx components/ReelsSection.tsx components/ReelsSection.module.css components/ReelsSection.test.tsx
git commit -m "feat: add reels section with placeholder and real embed support"
```

---

## Task 10: ReviewsCard Component

**Files:**
- Create: `components/ReviewsCard.tsx`
- Create: `components/ReviewsCard.module.css`
- Test: `components/ReviewsCard.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks (pure props component).
- Produces: `ReviewsCardProps { rating: number; reviewCount: number; profileUrl: string | null }`, default export `ReviewsCard`, section id `reviews`. Consumed by `app/page.tsx` (Task 13).

- [ ] **Step 1: Write the failing test**

```tsx
// components/ReviewsCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReviewsCard from '@/components/ReviewsCard';

describe('ReviewsCard', () => {
  it('renders the rating and review count', () => {
    render(<ReviewsCard rating={4.9} reviewCount={50} profileUrl={null} />);
    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText('(50+ Google Reviews)')).toBeInTheDocument();
  });

  it('renders a real link when profileUrl is provided', () => {
    render(<ReviewsCard rating={4.9} reviewCount={50} profileUrl="https://g.page/cab-detailing" />);
    expect(screen.getByRole('link', { name: 'View on Google' })).toHaveAttribute(
      'href',
      'https://g.page/cab-detailing'
    );
  });

  it('renders a disabled pending state when profileUrl is null', () => {
    render(<ReviewsCard rating={4.9} reviewCount={50} profileUrl={null} />);
    expect(screen.queryByRole('link', { name: 'View on Google' })).toBeNull();
    expect(screen.getByText('Google reviews link coming soon')).toBeInTheDocument();
  });

  it('sets the section id to reviews', () => {
    render(<ReviewsCard rating={4.9} reviewCount={50} profileUrl={null} />);
    expect(document.getElementById('reviews')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/ReviewsCard.test.tsx`
Expected: FAIL — `Cannot find module '@/components/ReviewsCard'`.

- [ ] **Step 3: Create `components/ReviewsCard.module.css`**

```css
.section {
  padding: 96px 24px;
}

.card {
  max-width: 560px;
  margin: 0 auto;
  text-align: center;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-chrome-mid);
  border-radius: var(--radius-card);
  padding: 48px 32px;
}

.rating {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.score {
  font-family: var(--font-display);
  font-size: 2.5rem;
}

.stars {
  color: var(--color-accent);
  font-size: 1.25rem;
}

.count {
  color: var(--color-text-muted);
}

.btnGoogle {
  display: inline-block;
  margin-top: 24px;
  background-color: var(--color-accent);
  color: #ffffff;
  padding: 12px 24px;
  border-radius: var(--radius-btn);
  font-weight: 600;
}

.btnGoogle:hover {
  box-shadow: 0 0 24px rgba(29, 62, 209, 0.55);
}

.btnDisabled {
  background-color: transparent;
  border: 1px dashed var(--color-chrome-mid);
  color: var(--color-text-muted);
  cursor: default;
}
```

- [ ] **Step 4: Create `components/ReviewsCard.tsx`**

```tsx
import styles from './ReviewsCard.module.css';

export interface ReviewsCardProps {
  rating: number;
  reviewCount: number;
  profileUrl: string | null;
}

export default function ReviewsCard({ rating, reviewCount, profileUrl }: ReviewsCardProps) {
  const filledStars = Math.round(rating);
  return (
    <section id="reviews" className={styles.section}>
      <div className={styles.card}>
        <h2>What Our Clients Say</h2>
        <div className={styles.rating}>
          <span className={styles.score}>{rating.toFixed(1)}</span>
          <span className={styles.stars} aria-hidden="true">
            {'★'.repeat(filledStars)}
            {'☆'.repeat(5 - filledStars)}
          </span>
          <span className={styles.count}>({reviewCount}+ Google Reviews)</span>
        </div>
        {profileUrl ? (
          <a href={profileUrl} className={styles.btnGoogle}>
            View on Google
          </a>
        ) : (
          <span className={`${styles.btnGoogle} ${styles.btnDisabled}`} aria-disabled="true">
            Google reviews link coming soon
          </span>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/ReviewsCard.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add components/ReviewsCard.tsx components/ReviewsCard.module.css components/ReviewsCard.test.tsx
git commit -m "feat: add ReviewsCard with real-link-only, no fabricated quotes"
```

---

## Task 11: PricingSection Component

**Files:**
- Create: `components/PricingSection.tsx`
- Create: `components/PricingSection.module.css`
- Test: `components/PricingSection.test.tsx`

**Interfaces:**
- Consumes: `PricingItem` type (Task 3).
- Produces: `PricingSectionProps { items: PricingItem[]; addonsImageSrc: string; pricesImageSrc: string; headlightImageSrc: string; detailsImageSrc: string }`, default export `PricingSection`, section id `services`. Consumed by `app/page.tsx` (Task 13).

- [ ] **Step 1: Write the failing test**

```tsx
// components/PricingSection.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PricingSection from '@/components/PricingSection';
import { siteConfig } from '@/content/site';

const props = {
  items: siteConfig.pricing,
  addonsImageSrc: siteConfig.pricingImages.addons,
  pricesImageSrc: siteConfig.pricingImages.prices,
  headlightImageSrc: siteConfig.pricingImages.headlight,
  detailsImageSrc: siteConfig.pricingImages.details,
};

describe('PricingSection', () => {
  it('renders every pricing item name and price', () => {
    render(<PricingSection {...props} />);
    for (const item of props.items) {
      expect(screen.getByText(item.name)).toBeInTheDocument();
      expect(screen.getByText(item.price)).toBeInTheDocument();
    }
  });

  it('renders the four supporting images', () => {
    render(<PricingSection {...props} />);
    expect(screen.getByRole('img', { name: /add-on services/i })).toHaveAttribute(
      'src',
      props.addonsImageSrc
    );
    expect(screen.getByRole('img', { name: /pricing reference/i })).toHaveAttribute(
      'src',
      props.pricesImageSrc
    );
    expect(screen.getByRole('img', { name: /headlight restoration/i })).toHaveAttribute(
      'src',
      props.headlightImageSrc
    );
    expect(screen.getByRole('img', { name: /detailing close-up/i })).toHaveAttribute(
      'src',
      props.detailsImageSrc
    );
  });

  it('sets the section id to services', () => {
    render(<PricingSection {...props} />);
    expect(document.getElementById('services')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/PricingSection.test.tsx`
Expected: FAIL — `Cannot find module '@/components/PricingSection'`.

- [ ] **Step 3: Create `components/PricingSection.module.css`**

```css
.section {
  padding: 96px 24px;
}

.inner {
  max-width: var(--container-max-width);
  margin: 0 auto;
  text-align: center;
}

.subtitle {
  color: var(--color-text-muted);
  margin-top: 8px;
}

.layout {
  margin-top: 48px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  text-align: left;
  align-items: start;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-chrome-mid);
  border-radius: var(--radius-card);
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(154, 148, 136, 0.3);
}

.item:last-child {
  border-bottom: none;
}

.detail {
  color: var(--color-text-muted);
  font-size: 0.85em;
}

.price {
  font-family: var(--font-display);
  color: var(--color-accent);
  white-space: nowrap;
}

.imageGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.imageGrid img {
  border-radius: var(--radius-card);
  border: 1px solid var(--color-chrome-mid);
  aspect-ratio: 1;
  object-fit: cover;
  width: 100%;
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Create `components/PricingSection.tsx`**

```tsx
import type { PricingItem } from '@/content/site';
import styles from './PricingSection.module.css';

export interface PricingSectionProps {
  items: PricingItem[];
  addonsImageSrc: string;
  pricesImageSrc: string;
  headlightImageSrc: string;
  detailsImageSrc: string;
}

export default function PricingSection({
  items,
  addonsImageSrc,
  pricesImageSrc,
  headlightImageSrc,
  detailsImageSrc,
}: PricingSectionProps) {
  return (
    <section id="services" className={styles.section}>
      <div className={styles.inner}>
        <h2>Add-On Services</h2>
        <p className={styles.subtitle}>Stack these onto any base package</p>
        <div className={styles.layout}>
          <ul className={styles.list}>
            {items.map((item) => (
              <li key={item.id} className={styles.item}>
                <span>
                  {item.name}
                  {item.detail && <small className={styles.detail}> ({item.detail})</small>}
                </span>
                <strong className={styles.price}>{item.price}</strong>
              </li>
            ))}
          </ul>
          <div className={styles.imageGrid}>
            <img src={addonsImageSrc} alt="Detailing add-on services" />
            <img src={pricesImageSrc} alt="Pricing reference sheet" />
            <img src={headlightImageSrc} alt="Headlight restoration before and after" />
            <img src={detailsImageSrc} alt="Detailing close-up" />
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/PricingSection.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add components/PricingSection.tsx components/PricingSection.module.css components/PricingSection.test.tsx
git commit -m "feat: add PricingSection with add-on list and supporting imagery"
```

---

## Task 12: ContactSection and Footer Components

**Files:**
- Create: `components/ContactSection.tsx`
- Create: `components/ContactSection.module.css`
- Test: `components/ContactSection.test.tsx`
- Create: `components/Footer.tsx`
- Create: `components/Footer.module.css`
- Test: `components/Footer.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks (pure props components).
- Produces: `ContactSectionProps { instagramDmUrl: string; phoneDisplay: string; phoneHref: string }` default export `ContactSection`, section id `contact`; `FooterProps { logoSrc: string; businessName: string; instagramDmUrl: string; googleProfileUrl: string | null }` default export `Footer`. Both consumed by `app/page.tsx` (Task 13).

- [ ] **Step 1: Write the failing test for ContactSection**

```tsx
// components/ContactSection.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContactSection from '@/components/ContactSection';

const props = {
  instagramDmUrl: 'https://instagram.com/direct/inbox/',
  phoneDisplay: '(406) 609-5321',
  phoneHref: 'tel:+14066095321',
};

describe('ContactSection', () => {
  it('renders a DM CTA linking to instagramDmUrl', () => {
    render(<ContactSection {...props} />);
    expect(screen.getByRole('link', { name: /dm us on instagram/i })).toHaveAttribute(
      'href',
      props.instagramDmUrl
    );
  });

  it('renders a call CTA linking to phoneHref and showing phoneDisplay', () => {
    render(<ContactSection {...props} />);
    const link = screen.getByRole('link', {
      name: new RegExp(props.phoneDisplay.replace(/[()]/g, '\\$&')),
    });
    expect(link).toHaveAttribute('href', props.phoneHref);
  });

  it('sets the section id to contact', () => {
    render(<ContactSection {...props} />);
    expect(document.getElementById('contact')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/ContactSection.test.tsx`
Expected: FAIL — `Cannot find module '@/components/ContactSection'`.

- [ ] **Step 3: Create `components/ContactSection.module.css`**

```css
.section {
  padding: 96px 24px;
  text-align: center;
}

.inner {
  max-width: 640px;
  margin: 0 auto;
}

.inner p {
  color: var(--color-text-muted);
  margin-top: 12px;
}

.actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 32px;
}

.btnInstagram {
  background-color: var(--color-accent);
  color: #ffffff;
  padding: 16px 32px;
  border-radius: var(--radius-btn);
  font-weight: 600;
}

.btnInstagram:hover {
  box-shadow: 0 0 32px rgba(29, 62, 209, 0.6);
}

.btnPhone {
  border: 1px solid var(--color-chrome-mid);
  color: var(--color-text);
  padding: 16px 32px;
  border-radius: var(--radius-btn);
  font-weight: 600;
}

@media (max-width: 640px) {
  .actions {
    flex-direction: column;
  }
}
```

- [ ] **Step 4: Create `components/ContactSection.tsx`**

```tsx
import styles from './ContactSection.module.css';

export interface ContactSectionProps {
  instagramDmUrl: string;
  phoneDisplay: string;
  phoneHref: string;
}

export default function ContactSection({
  instagramDmUrl,
  phoneDisplay,
  phoneHref,
}: ContactSectionProps) {
  return (
    <section id="contact" className={styles.section}>
      <div className={styles.inner}>
        <h2>Ready to Book Your Detail?</h2>
        <p>DM us on Instagram or call/text to discuss pricing and schedule your appointment.</p>
        <div className={styles.actions}>
          <a href={instagramDmUrl} className={styles.btnInstagram}>
            DM Us on Instagram
          </a>
          <a href={phoneHref} className={styles.btnPhone}>
            Call / Text {phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/ContactSection.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Write the failing test for Footer**

```tsx
// components/Footer.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';

const baseProps = {
  logoSrc: '/images/logo.jpg',
  businessName: 'CAB Premium Detailing',
  instagramDmUrl: 'https://instagram.com/direct/inbox/',
};

describe('Footer', () => {
  it('renders an Instagram link using instagramDmUrl', () => {
    render(<Footer {...baseProps} googleProfileUrl={null} />);
    expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
      'href',
      baseProps.instagramDmUrl
    );
  });

  it('omits the Google Page link when googleProfileUrl is null', () => {
    render(<Footer {...baseProps} googleProfileUrl={null} />);
    expect(screen.queryByRole('link', { name: 'Google Page' })).toBeNull();
  });

  it('renders the Google Page link when googleProfileUrl is provided', () => {
    render(<Footer {...baseProps} googleProfileUrl="https://g.page/cab-detailing" />);
    expect(screen.getByRole('link', { name: 'Google Page' })).toHaveAttribute(
      'href',
      'https://g.page/cab-detailing'
    );
  });

  it('renders the current year in the copyright line', () => {
    render(<Footer {...baseProps} googleProfileUrl={null} />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run components/Footer.test.tsx`
Expected: FAIL — `Cannot find module '@/components/Footer'`.

- [ ] **Step 8: Create `components/Footer.module.css`**

```css
.footer {
  border-top: 1px solid var(--color-chrome-mid);
  padding: 48px 24px;
}

.inner {
  max-width: var(--container-max-width);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  color: var(--color-text-muted);
}

.logo {
  height: 40px;
  width: auto;
  border-radius: 6px;
}

.social {
  display: flex;
  gap: 24px;
  text-transform: uppercase;
  font-size: 13px;
  letter-spacing: 0.04em;
}

.social a:hover {
  color: var(--color-text);
}
```

- [ ] **Step 9: Create `components/Footer.tsx`**

```tsx
import styles from './Footer.module.css';

export interface FooterProps {
  logoSrc: string;
  businessName: string;
  instagramDmUrl: string;
  googleProfileUrl: string | null;
}

export default function Footer({
  logoSrc,
  businessName,
  instagramDmUrl,
  googleProfileUrl,
}: FooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <img src={logoSrc} alt={`${businessName} logo`} className={styles.logo} />
        <p>
          © {year} {businessName}. All rights reserved.
        </p>
        <div className={styles.social}>
          <a href={instagramDmUrl}>Instagram</a>
          {googleProfileUrl && <a href={googleProfileUrl}>Google Page</a>}
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 10: Run test to verify it passes**

Run: `npx vitest run components/Footer.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 11: Commit**

```bash
git add components/ContactSection.tsx components/ContactSection.module.css components/ContactSection.test.tsx components/Footer.tsx components/Footer.module.css components/Footer.test.tsx
git commit -m "feat: add ContactSection and Footer components"
```

---

## Task 13: Page Composition

**Files:**
- Modify: `app/page.tsx`
- Test: `app/page.test.tsx`

**Interfaces:**
- Consumes: `siteConfig` (Task 3), `Nav` (Task 5), `Hero` (Task 6), `BeforeAfterSection` (Task 8), `ReelsSection` (Task 9), `ReviewsCard` (Task 10), `PricingSection` (Task 11), `ContactSection`/`Footer` (Task 12).
- Produces: the full assembled page, default export `Home` from `app/page.tsx`.

- [ ] **Step 1: Write the failing test**

```tsx
// app/page.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import { siteConfig } from '@/content/site';

describe('Home page composition', () => {
  it('renders all major sections with their anchor ids', () => {
    render(<Home />);
    expect(document.getElementById('hero')).not.toBeNull();
    expect(document.getElementById('portfolio')).not.toBeNull();
    expect(document.getElementById('social-showcase')).not.toBeNull();
    expect(document.getElementById('reviews')).not.toBeNull();
    expect(document.getElementById('services')).not.toBeNull();
    expect(document.getElementById('contact')).not.toBeNull();
  });

  it('renders one slider per configured before/after pair', () => {
    render(<Home />);
    expect(screen.getAllByRole('slider')).toHaveLength(siteConfig.beforeAfterPairs.length);
  });

  it('renders the Call Now nav link with the configured tel href', () => {
    render(<Home />);
    expect(screen.getByRole('link', { name: 'Call Now' })).toHaveAttribute(
      'href',
      siteConfig.phoneHref
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/page.test.tsx`
Expected: FAIL — `app/page.tsx` still renders only the Task 1 placeholder (`<main>CAB</main>`), so section ids and the slider/link roles are missing.

- [ ] **Step 3: Replace `app/page.tsx` with the full composition**

```tsx
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import BeforeAfterSection from '@/components/BeforeAfterSection';
import ReelsSection from '@/components/ReelsSection';
import ReviewsCard from '@/components/ReviewsCard';
import PricingSection from '@/components/PricingSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import { siteConfig } from '@/content/site';

export default function Home() {
  return (
    <>
      <Nav
        phoneDisplay={siteConfig.phoneDisplay}
        phoneHref={siteConfig.phoneHref}
        instagramDmUrl={siteConfig.instagramDmUrl}
        logoSrc={siteConfig.logoSrc}
        businessName={siteConfig.businessName}
      />
      <main>
        <Hero
          heroImageSrc={siteConfig.heroImageSrc}
          phoneDisplay={siteConfig.phoneDisplay}
          phoneHref={siteConfig.phoneHref}
          instagramDmUrl={siteConfig.instagramDmUrl}
        />
        <BeforeAfterSection pairs={siteConfig.beforeAfterPairs} />
        <ReelsSection reels={siteConfig.reels} />
        <ReviewsCard
          rating={siteConfig.googleReview.rating}
          reviewCount={siteConfig.googleReview.reviewCount}
          profileUrl={siteConfig.googleReview.profileUrl}
        />
        <PricingSection
          items={siteConfig.pricing}
          addonsImageSrc={siteConfig.pricingImages.addons}
          pricesImageSrc={siteConfig.pricingImages.prices}
          headlightImageSrc={siteConfig.pricingImages.headlight}
          detailsImageSrc={siteConfig.pricingImages.details}
        />
        <ContactSection
          instagramDmUrl={siteConfig.instagramDmUrl}
          phoneDisplay={siteConfig.phoneDisplay}
          phoneHref={siteConfig.phoneHref}
        />
      </main>
      <Footer
        logoSrc={siteConfig.logoSrc}
        businessName={siteConfig.businessName}
        instagramDmUrl={siteConfig.instagramDmUrl}
        googleProfileUrl={siteConfig.googleReview.profileUrl}
      />
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/page.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the full test suite**

Run: `npm run test`
Expected: all test files pass (Tasks 3–13 combined).

- [ ] **Step 6: Verify the production build**

Run: `npm run build`
Expected: build succeeds, `out/index.html` contains the real headline text.

Verify with: `grep -q "Premium Detailing for Cars" out/index.html && echo OK`
Expected output: `OK`

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx app/page.test.tsx
git commit -m "feat: compose full landing page from all sections"
```

---

## Task 14: GitHub Pages Deployment

**Files:**
- Modify: `next.config.js`
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: nothing (build/deploy configuration only).
- Produces: static export served correctly under `/CAB/` on GitHub Pages, and an Actions workflow that builds, tests, and deploys on every push to `main`.

- [ ] **Step 1: Modify `next.config.js` to add the GitHub Pages basePath**

```js
/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const repoName = 'CAB';

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: isGithubPages ? `/${repoName}` : '',
  assetPrefix: isGithubPages ? `/${repoName}/` : '',
};

module.exports = nextConfig;
```

- [ ] **Step 2: Verify the default build has no basePath**

Run: `npm run build && grep -c '/CAB/_next' out/index.html`
Expected output: `0`

- [ ] **Step 3: Verify the GitHub Pages build has the basePath**

Run: `GITHUB_PAGES=true npm run build && grep -o '/CAB/_next' out/index.html | head -1`
Expected output: `/CAB/_next`

- [ ] **Step 4: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run prepare-images
      - run: npm run test
      - run: GITHUB_PAGES=true npm run build
      - run: touch out/.nojekyll
      - uses: actions/upload-pages-artifact@v3
        with:
          path: out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 5: Commit**

```bash
git add next.config.js .github/workflows/deploy.yml
git commit -m "feat: configure static export and GitHub Pages deploy workflow"
```

- [ ] **Step 6: Push and enable Pages (manual, one-time)**

Run: `git push origin main`

Then in the browser: go to `https://github.com/craiglawsonnn/CAB/settings/pages` and set **Source** to **GitHub Actions**. This is a one-time repo setting — it cannot be done via git. After the workflow run completes, the site is live at `https://craiglawsonnn.github.io/CAB/`.

---

## Task 15: Final QA Pass

**Files:**
- None (verification only — no code changes expected unless a check below fails, in which case fix the specific component/file it points to and re-run that component's existing test suite).

- [ ] **Step 1: Responsive check**

Run: `npm run dev`, then open `http://localhost:3000` in a browser and use dev tools device toolbar to check three widths: 375px (mobile), 768px (tablet), 1280px (desktop).
Expected: nav collapses correctly below 768px (per `Nav.module.css`), before/after grid and pricing layout reflow to single column below 768px, no horizontal scroll at any width.

- [ ] **Step 2: Lighthouse pass**

Run: `npm run build && npx serve out -l 3000` (in one terminal), then `npx lighthouse http://localhost:3000 --view --preset=desktop` (in another).
Expected: Performance, Accessibility, and SEO scores each 90+. If Accessibility flags contrast on `--color-text-muted` against `--color-bg`, darken `--color-bg` or lighten `--color-text-muted` in `app/globals.css` and re-run.

- [ ] **Step 3: Touch slider check**

In the browser dev tools device toolbar, enable touch simulation and drag the divider on at least two before/after sliders.
Expected: the divider follows the touch drag smoothly (verifies the `onPointerDown`/`onPointerMove` handlers in `BeforeAfterSlider.tsx` work for touch pointers, not just mouse).

- [ ] **Step 4: CTA verification**

Click every "Call Now" / "Call / Text" button and confirm the browser offers to dial `(406) 609-5321`. Click every "DM on Instagram" button and confirm it opens the configured Instagram URL.
Expected: all resolve without a 404 or blank page.

- [ ] **Step 5: Placeholder content confirmation**

Run: `grep -rn "instagram.com/direct/inbox" content/site.ts` and `grep -n "profileUrl: null" content/site.ts` and `grep -n "embedUrl: null" content/site.ts`.
Expected: these all still match, confirming the three known open items (real Instagram handle, real Google Business Profile URL, real reel URLs) are still clearly placeholder values rather than something fabricated — replace each in `content/site.ts` with the real value as soon as it's supplied, then re-run `npm run test` to confirm nothing broke.

- [ ] **Step 6: Final full verification**

Run: `npm run test && npm run build`
Expected: all tests pass, build succeeds with no errors.

