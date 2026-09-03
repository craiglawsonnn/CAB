# Content Model Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every visible string on the site — not just the data already in `content/site.ts`, but every hardcoded heading, button label, and section subtitle currently living in component JSX — into one content file, so the whole page becomes fully data-driven ahead of building an admin editor on top of it.

**Architecture:** All content moves into a new `content/site.json` (the real source of truth). `content/site.ts` becomes a typed loader: it imports the JSON, applies the existing GitHub Pages `basePath` prefix to image paths (unchanged behavior — this plan does not touch hosting), and re-exports `siteConfig` with the same typed interfaces components already rely on. Every component that currently hardcodes now-in-scope text is updated to accept that text as props instead, sourced from `siteConfig` via `app/page.tsx`.

**Tech Stack:** Next.js 15, React 18, TypeScript (`resolveJsonModule` is already enabled in `tsconfig.json`), Vitest + Testing Library (existing test stack, no new dependencies).

**Spec:** `docs/superpowers/specs/2026-09-03-admin-cms-design.md`

## Global Constraints

- Every visible string becomes a prop sourced from `content/site.json` — no new hardcoded copy strings in JSX (per spec section 2: "editable text scope = literally every visible string on the page").
- `content/site.ts` keeps exporting `siteConfig` with the same typed shape components already import from — this plan restructures the shape (see below) but every consumer must be updated in the same task that changes the shape it depends on, so the suite is green after every task.
- Do not touch hosting, `next.config.js`, `.github/workflows/`, or `lib/basePath.ts` in this plan — those change in the follow-up "Vercel migration + admin UI" plan. Image paths keep going through `basePath` exactly as they do today.
- No new runtime dependencies. `resolveJsonModule` in `tsconfig.json` already allows `import raw from './site.json'` with inferred types.
- Follow TDD for every step: write the failing test, watch it fail, write minimal code, watch it pass, commit.

---

## Shape change (read this before Task 1)

Today `siteConfig` is flat: `beforeAfterPairs`, `reels`, `packages`, `pricing` (an add-ons array), `gallery` are all top-level arrays. This plan groups each page section under its own key, and adds a copy field for every heading/subtitle/button label that section needs:

| Old path | New path |
|---|---|
| `siteConfig.beforeAfterPairs` | `siteConfig.beforeAfter.pairs` |
| `siteConfig.gallery` (array) | `siteConfig.gallery.images` |
| `siteConfig.reels` (array) | `siteConfig.reels.items` |
| `siteConfig.packages` | `siteConfig.pricing.packages` |
| `siteConfig.pricing` (add-ons array) | `siteConfig.pricing.addons` |
| `siteConfig.standaloneOptions` | `siteConfig.pricing.standaloneOptions` |
| `siteConfig.standaloneCaveat` | `siteConfig.pricing.standaloneCaveat` |
| `siteConfig.quoteServices` | `siteConfig.pricing.quoteServices` |

`businessName`, `phoneDisplay`, `phoneHref`, `instagramDmUrl`, `logoSrc`, `heroImageSrc`, `googleReview` stay top-level. A new top-level `instagramPendingLabel` replaces the "Instagram DM — coming soon" string that's currently duplicated across four components.

Task 1 makes this restructuring and fixes every existing consumer (so the app keeps working exactly as it does today, just reorganized). Tasks 2–10 then add the *new* copy fields to each component, one section at a time.

**Note on an existing bug this plan fixes in passing:** `content/site.ts` already has a `standaloneCaveat` field ("Pricing may vary depending on vehicle size and condition."), but `PricingSection.tsx` never renders it — it was left out when the pricing content was rebuilt. Task 8 renders it.

---

### Task 1: Restructure `siteConfig` into `content/site.json` + typed loader

**Files:**
- Create: `content/site.json`
- Modify: `content/site.ts` (full rewrite)
- Modify: `content/site.test.ts` (update paths to new shape)
- Modify: `components/PricingSection.test.tsx:6-9` (update paths to new shape)
- Modify: `components/ReelsSection.test.tsx:8,9,17` (update paths to new shape)
- Modify: `components/BeforeAfterSection.test.tsx:9,14,19,20,27` (update paths to new shape)
- Modify: `app/page.tsx` (update paths to new shape)

**Interfaces:**
- Produces: `siteConfig: SiteConfig` with the shape described in the table above. Item-level types (`BeforeAfterPair`, `GalleryImage`, `ReelItem`, `PricingPackage`, `ServiceChecklist`, `StandaloneOption`, `QuoteService`, `PricingItem`) keep their existing field names — only their container paths move.
- Consumes: nothing (this is the foundation task).

- [ ] **Step 1: Update `content/site.test.ts` to the new paths (this is the failing test)**

Replace the file with:

```typescript
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

  it('has a shared Instagram-pending label used across the site', () => {
    expect(siteConfig.instagramPendingLabel).toBe('Instagram DM — coming soon');
  });

  it('has exactly six before/after pairs, each with images on disk', () => {
    expect(siteConfig.beforeAfter.pairs).toHaveLength(6);
    for (const pair of siteConfig.beforeAfter.pairs) {
      assertImageExists(pair.beforeSrc);
      assertImageExists(pair.afterSrc);
    }
  });

  it('has exactly four add-on pricing items', () => {
    expect(siteConfig.pricing.addons).toHaveLength(4);
  });

  it('has exactly two packages, each with at least one checklist of at least one item', () => {
    expect(siteConfig.pricing.packages).toHaveLength(2);
    for (const pkg of siteConfig.pricing.packages) {
      expect(pkg.checklists.length).toBeGreaterThan(0);
      for (const checklist of pkg.checklists) {
        expect(checklist.items.length).toBeGreaterThan(0);
      }
    }
  });

  it('corrects the pre-wash step to plain "Pre-wash" (not "Two-step pre-wash")', () => {
    const refresh = siteConfig.pricing.packages.find((pkg) => pkg.id === 'refresh');
    const exterior = refresh?.checklists.find((c) => c.heading.startsWith('EXTERIOR'));
    expect(exterior?.items).toContain('Pre-wash');
    expect(exterior?.items).not.toContain('Two-step pre-wash');
  });

  it('has exactly four standalone options', () => {
    expect(siteConfig.pricing.standaloneOptions).toHaveLength(4);
  });

  it('has exactly two quote-based services, each with at least one pricing factor', () => {
    expect(siteConfig.pricing.quoteServices).toHaveLength(2);
    for (const service of siteConfig.pricing.quoteServices) {
      expect(service.factors.length).toBeGreaterThan(0);
    }
  });

  it('references gallery images that exist on disk', () => {
    expect(siteConfig.gallery.images.length).toBeGreaterThan(0);
    for (const image of siteConfig.gallery.images) {
      assertImageExists(image.src);
    }
  });

  it('references a logo and hero image that exist on disk', () => {
    assertImageExists(siteConfig.logoSrc);
    assertImageExists(siteConfig.heroImageSrc);
  });

  it('uses the confirmed Google Business Profile url', () => {
    expect(siteConfig.googleReview.profileUrl).toBe(
      'https://maps.app.goo.gl/HFcJiYVWfW2wRLeA9?g_st=ii'
    );
  });

  it('has a real Instagram reel url for every reel', () => {
    for (const reel of siteConfig.reels.items) {
      expect(reel.embedUrl).toMatch(/^https:\/\/www\.instagram\.com\/reel\//);
    }
  });

  it('uses the confirmed Instagram DM url', () => {
    expect(siteConfig.instagramDmUrl).toBe('https://ig.me/m/cab.premiumdetailing');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run content/site.test.ts`
Expected: FAIL — `siteConfig.beforeAfter` (and the other new paths) are `undefined`, because `content/site.ts` still exports the old flat shape.

- [ ] **Step 3: Create `content/site.json`**

```json
{
  "businessName": "CAB Premium Detailing",
  "phoneDisplay": "(406) 609-5321",
  "phoneHref": "tel:+14066095321",
  "instagramDmUrl": "https://ig.me/m/cab.premiumdetailing",
  "instagramPendingLabel": "Instagram DM — coming soon",
  "logoSrc": "/images/logo.jpg",
  "heroImageSrc": "/images/hero.jpg",
  "nav": {
    "links": [
      { "href": "#services", "label": "Services" },
      { "href": "#portfolio", "label": "Before & After" },
      { "href": "#gallery", "label": "Gallery" },
      { "href": "#social-showcase", "label": "Reels" },
      { "href": "#reviews", "label": "Reviews" },
      { "href": "#contact", "label": "Contact" }
    ],
    "callButtonLabel": "Call Now",
    "instagramButtonLabel": "DM on Instagram"
  },
  "hero": {
    "badge": "Mobile & Premium Service",
    "headline": "Premium Detailing for Cars, Airplanes & Boats",
    "subtitle": "Mobile service. Unmatched quality. Restoring high-end vehicles to showroom perfection.",
    "instagramButtonLabel": "Book via Instagram DM",
    "callButtonPrefix": "Call / Text "
  },
  "beforeAfter": {
    "heading": "Our Work: Before & After",
    "subtitle": "Drag the divider to see the transformation",
    "viewMoreTemplate": "View {count} More",
    "showFewerLabel": "Show Fewer",
    "pairs": [
      {
        "id": "driver-door",
        "beforeSrc": "/images/driver-door-before.jpg",
        "afterSrc": "/images/driver-door-after.jpg",
        "beforeAlt": "Driver door interior before detailing",
        "afterAlt": "Driver door interior after detailing",
        "caption": "Driver Door: Leather & Trim Restoration"
      },
      {
        "id": "passenger",
        "beforeSrc": "/images/passenger-before.jpg",
        "afterSrc": "/images/passenger-after.jpg",
        "beforeAlt": "Passenger area before detailing",
        "afterAlt": "Passenger area after detailing",
        "caption": "Passenger Area: Full Interior Detail"
      },
      {
        "id": "behind-seats",
        "beforeSrc": "/images/behind-seats-before.jpg",
        "afterSrc": "/images/behind-seats-after.jpg",
        "beforeAlt": "Behind seats and floor mats before detailing",
        "afterAlt": "Behind seats and floor mats after detailing",
        "caption": "Deep Carpet Extraction & Floor Mat Care"
      },
      {
        "id": "boot-1",
        "beforeSrc": "/images/boot-1-before.jpg",
        "afterSrc": "/images/boot-1-after.jpg",
        "beforeAlt": "Trunk cargo area before detailing",
        "afterAlt": "Trunk cargo area after detailing",
        "caption": "Full Trunk & Cargo Bay Detail"
      },
      {
        "id": "boot-2",
        "beforeSrc": "/images/boot-2-before.jpg",
        "afterSrc": "/images/boot-2-after.jpg",
        "beforeAlt": "SUV cargo area before detailing",
        "afterAlt": "SUV cargo area after detailing",
        "caption": "SUV Cargo Bay Detail"
      },
      {
        "id": "car-door",
        "beforeSrc": "/images/car-door-before.jpg",
        "afterSrc": "/images/car-door-after.jpg",
        "beforeAlt": "Car door panel before detailing",
        "afterAlt": "Car door panel after detailing",
        "caption": "Door Panel Interior Restoration"
      }
    ]
  },
  "gallery": {
    "heading": "Gallery",
    "subtitle": "More of our recent work",
    "images": [
      {
        "id": "headlight-restore",
        "src": "/images/headlight-restore.jpg",
        "alt": "Headlight restoration before and after",
        "caption": "Headlight Restoration"
      }
    ]
  },
  "reels": {
    "heading": "Video Showcase",
    "subtitle": "Watch our process in action on TikTok & Instagram",
    "items": [
      {
        "id": "reel-1",
        "caption": "Before & After: See the Transformation",
        "embedUrl": "https://www.instagram.com/reel/DcG2WtAR9fc/"
      },
      {
        "id": "reel-2",
        "caption": "Full Detail Walkthrough",
        "embedUrl": "https://www.instagram.com/reel/DcSK2VWRgKT/"
      },
      {
        "id": "reel-3",
        "caption": "Meet CAB Premium Detailing",
        "embedUrl": "https://www.instagram.com/reel/DcCID9YJ5pC/"
      }
    ]
  },
  "googleReview": {
    "rating": 4.9,
    "reviewCount": 50,
    "profileUrl": "https://maps.app.goo.gl/HFcJiYVWfW2wRLeA9?g_st=ii",
    "heading": "What Our Clients Say",
    "countTemplate": "({count}+ Google Reviews)",
    "viewButtonLabel": "View on Google",
    "pendingLabel": "Google reviews link coming soon"
  },
  "pricing": {
    "heading": "Packages & Pricing",
    "subtitle": "Choose the level of care your car deserves",
    "packages": [
      {
        "id": "refresh",
        "name": "Refresh Detail",
        "price": "$200",
        "savingsNote": "Interior + Exterior — $200 instead of $219.",
        "description": "A complete interior and exterior refresh to keep your vehicle clean, fresh, and looking its best.",
        "checklists": [
          {
            "heading": "EXTERIOR — $79",
            "items": [
              "Pre-wash",
              "Hand wash",
              "Door jambs cleaned",
              "Wheels & tires cleaned",
              "Tire dressing",
              "Hand dry",
              "Windows cleaned inside & out"
            ]
          },
          {
            "heading": "INTERIOR — $140",
            "items": [
              "Full interior vacuum",
              "Interior air blow-out",
              "Vacuum under floor mats",
              "Floor mats vacuumed",
              "Trunk vacuumed",
              "Wipe-down of all interior surfaces",
              "Cup holders & center console detailed",
              "Dashboard & instrument cluster cleaned",
              "Windows cleaned inside & out"
            ]
          }
        ],
        "pricingCaveat": "Pricing may vary depending on vehicle size and condition.",
        "ctaLabel": "Book Refresh Detail — $200"
      },
      {
        "id": "full",
        "name": "Full Detail",
        "tagline": "Our Most Complete Detail",
        "price": "$300",
        "savingsNote": "Interior + Exterior — SAVE $20. Get both services together for $300 instead of $320.",
        "description": "A deep interior and exterior cleaning designed to give your vehicle a full reset.",
        "checklists": [
          {
            "heading": "EXTERIOR — $120",
            "note": "Everything included in Exterior Refresh, plus:",
            "items": [
              "Deep wheel cleaning",
              "Trim dressing",
              "Fuel door & gas cap area cleaned",
              "Bug & road grime removal",
              "Spray wax finish"
            ]
          },
          {
            "heading": "INTERIOR — $200",
            "note": "Everything included in Interior Refresh, plus:",
            "items": [
              "Deep carpet cleaning",
              "Floor mats shampooed",
              "Deep interior cleaning",
              "Stain removal",
              "Full seat cleaning & shampoo",
              "UV protection for interior plastic surfaces",
              "Leather conditioning",
              "Detailed crevice cleaning"
            ]
          }
        ],
        "pricingCaveat": "Pricing may vary depending on vehicle size and condition.",
        "ctaLabel": "Book Full Detail — $300",
        "highlight": true
      }
    ],
    "standaloneHeading": "Only Need One?",
    "standaloneSubtitle": "You can book your interior or exterior service separately.",
    "standaloneOptions": [
      { "id": "exterior-refresh", "name": "Exterior Refresh", "price": "$79" },
      { "id": "interior-refresh", "name": "Interior Refresh", "price": "$140" },
      {
        "id": "full-exterior",
        "name": "Full Exterior",
        "price": "$120",
        "groupLabel": "For a deeper clean:"
      },
      { "id": "full-interior", "name": "Full Interior", "price": "$200" }
    ],
    "standaloneCaveat": "Pricing may vary depending on vehicle size and condition.",
    "quoteHeading": "Correction & Protection Services",
    "quoteSubtitle": "Contact us for a personalized quote",
    "quoteFactorsLabel": "Pricing varies depending on:",
    "quoteServices": [
      {
        "id": "polishing",
        "name": "Polishing & Scratch Removal",
        "startingPrice": "Starting at $100",
        "description": "Professional paint polishing and scratch removal tailored to your vehicle.",
        "factors": [
          "Vehicle size",
          "Condition of the paint",
          "Type and depth of scratches",
          "Desired results and level of correction"
        ],
        "note": "Every vehicle is different, so we recommend contacting us for a personalized quote.",
        "ctaLabel": "Call or message us to discuss your vehicle and get a quote."
      },
      {
        "id": "ceramic-coating",
        "name": "Ceramic Coating",
        "tagline": "3-Year Ceramic Coating",
        "startingPrice": "Starting at $500",
        "description": "Long-lasting paint protection, enhanced gloss, and easier maintenance.",
        "factors": [
          "Vehicle size",
          "Condition of the paint",
          "Whether paint polishing or correction is needed before application",
          "Level of paint correction desired",
          "Overall condition of the vehicle"
        ],
        "note": "Every vehicle is different, so we recommend contacting us for a personalized quote.",
        "ctaLabel": "Call or message us to discuss your vehicle and get a quote."
      }
    ],
    "addonsHeading": "Add-On Services",
    "addonsSubtitle": "Stack these onto any package",
    "addons": [
      { "id": "headlight", "name": "Headlight Restoration", "price": "$80–$120" },
      { "id": "pet-hair", "name": "Heavy Pet Hair Removal", "price": "From $40" },
      {
        "id": "ceramic-spray",
        "name": "Ceramic Spray Protection",
        "detail": "Lasts 3–6 months",
        "price": "$60–$75"
      },
      { "id": "odor", "name": "Odor Elimination", "detail": "Ozone Treatment", "price": "$50" }
    ]
  },
  "contact": {
    "heading": "Ready to Book Your Detail?",
    "body": "DM us on Instagram or call/text to discuss pricing and schedule your appointment.",
    "instagramButtonLabel": "DM Us on Instagram",
    "callButtonPrefix": "Call / Text "
  },
  "footer": {
    "copyrightSuffix": "All rights reserved.",
    "instagramLabel": "Instagram",
    "googleLabel": "Google Page"
  }
}
```

- [ ] **Step 4: Rewrite `content/site.ts` as a typed loader over the JSON**

```typescript
import { basePath } from '@/lib/basePath';
import raw from './site.json';

export interface NavLink {
  href: string;
  label: string;
}

export interface NavConfig {
  links: NavLink[];
  callButtonLabel: string;
  instagramButtonLabel: string;
}

export interface HeroConfig {
  badge: string;
  headline: string;
  subtitle: string;
  instagramButtonLabel: string;
  callButtonPrefix: string;
}

export interface BeforeAfterPair {
  id: string;
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  caption: string;
}

export interface BeforeAfterConfig {
  heading: string;
  subtitle: string;
  viewMoreTemplate: string;
  showFewerLabel: string;
  pairs: BeforeAfterPair[];
}

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption: string;
}

export interface GalleryConfig {
  heading: string;
  subtitle: string;
  images: GalleryImage[];
}

export interface ReelItem {
  id: string;
  caption: string;
  embedUrl: string | null;
}

export interface ReelsConfig {
  heading: string;
  subtitle: string;
  items: ReelItem[];
}

export interface GoogleReviewConfig {
  rating: number;
  reviewCount: number;
  profileUrl: string | null;
  heading: string;
  countTemplate: string;
  viewButtonLabel: string;
  pendingLabel: string;
}

export interface ServiceChecklist {
  heading: string;
  note?: string;
  items: string[];
}

export interface PricingPackage {
  id: string;
  name: string;
  tagline?: string;
  price: string;
  savingsNote: string;
  description: string;
  checklists: ServiceChecklist[];
  pricingCaveat: string;
  ctaLabel: string;
  highlight?: boolean;
}

export interface StandaloneOption {
  id: string;
  name: string;
  price: string;
  groupLabel?: string;
}

export interface QuoteService {
  id: string;
  name: string;
  tagline?: string;
  startingPrice: string;
  description: string;
  factors: string[];
  note: string;
  ctaLabel: string;
}

export interface PricingItem {
  id: string;
  name: string;
  detail?: string;
  price: string;
}

export interface PricingConfig {
  heading: string;
  subtitle: string;
  packages: PricingPackage[];
  standaloneHeading: string;
  standaloneSubtitle: string;
  standaloneOptions: StandaloneOption[];
  standaloneCaveat: string;
  quoteHeading: string;
  quoteSubtitle: string;
  quoteFactorsLabel: string;
  quoteServices: QuoteService[];
  addonsHeading: string;
  addonsSubtitle: string;
  addons: PricingItem[];
}

export interface ContactConfig {
  heading: string;
  body: string;
  instagramButtonLabel: string;
  callButtonPrefix: string;
}

export interface FooterConfig {
  copyrightSuffix: string;
  instagramLabel: string;
  googleLabel: string;
}

export interface SiteConfig {
  businessName: string;
  phoneDisplay: string;
  phoneHref: string;
  instagramDmUrl: string | null;
  instagramPendingLabel: string;
  logoSrc: string;
  heroImageSrc: string;
  nav: NavConfig;
  hero: HeroConfig;
  beforeAfter: BeforeAfterConfig;
  gallery: GalleryConfig;
  reels: ReelsConfig;
  googleReview: GoogleReviewConfig;
  pricing: PricingConfig;
  contact: ContactConfig;
  footer: FooterConfig;
}

function withBasePath(src: string): string {
  return `${basePath}${src}`;
}

export const siteConfig: SiteConfig = {
  ...raw,
  logoSrc: withBasePath(raw.logoSrc),
  heroImageSrc: withBasePath(raw.heroImageSrc),
  beforeAfter: {
    ...raw.beforeAfter,
    pairs: raw.beforeAfter.pairs.map((pair) => ({
      ...pair,
      beforeSrc: withBasePath(pair.beforeSrc),
      afterSrc: withBasePath(pair.afterSrc),
    })),
  },
  gallery: {
    ...raw.gallery,
    images: raw.gallery.images.map((image) => ({ ...image, src: withBasePath(image.src) })),
  },
};
```

- [ ] **Step 5: Fix `app/page.tsx` for the new paths**

Update the JSX to read from the new nested locations:

```typescript
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import BeforeAfterSection from '@/components/BeforeAfterSection';
import GallerySection from '@/components/GallerySection';
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
        <BeforeAfterSection pairs={siteConfig.beforeAfter.pairs} />
        <GallerySection images={siteConfig.gallery.images} />
        <ReelsSection reels={siteConfig.reels.items} />
        <ReviewsCard
          rating={siteConfig.googleReview.rating}
          reviewCount={siteConfig.googleReview.reviewCount}
          profileUrl={siteConfig.googleReview.profileUrl}
        />
        <PricingSection
          packages={siteConfig.pricing.packages}
          standaloneOptions={siteConfig.pricing.standaloneOptions}
          quoteServices={siteConfig.pricing.quoteServices}
          items={siteConfig.pricing.addons}
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

- [ ] **Step 6: Fix the three other test files that reference the old paths**

In `components/PricingSection.test.tsx`, replace the `props` block:

```typescript
const props = {
  packages: siteConfig.pricing.packages,
  standaloneOptions: siteConfig.pricing.standaloneOptions,
  quoteServices: siteConfig.pricing.quoteServices,
  items: siteConfig.pricing.addons,
};
```

In `components/ReelsSection.test.tsx`, replace every `siteConfig.reels` with `siteConfig.reels.items`.

In `components/BeforeAfterSection.test.tsx`, replace every `siteConfig.beforeAfterPairs` with `siteConfig.beforeAfter.pairs`.

- [ ] **Step 7: Run the full test suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add content/site.json content/site.ts content/site.test.ts app/page.tsx components/PricingSection.test.tsx components/ReelsSection.test.tsx components/BeforeAfterSection.test.tsx
git commit -m "refactor: move site content into content/site.json, group by section"
```

---

### Task 2: Nav — config-driven links and button labels

**Files:**
- Modify: `components/Nav.tsx`
- Modify: `components/Nav.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `siteConfig.nav: NavConfig` (from Task 1), `siteConfig.instagramPendingLabel: string`.
- Produces: `NavProps` gains `links: NavLink[]`, `callButtonLabel: string`, `instagramButtonLabel: string`, `instagramPendingLabel: string`.

- [ ] **Step 1: Update the failing test**

Replace `components/Nav.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Nav from '@/components/Nav';

const props = {
  phoneDisplay: '(406) 609-5321',
  phoneHref: 'tel:+14066095321',
  instagramDmUrl: 'https://instagram.com/direct/inbox/',
  logoSrc: '/images/logo.jpg',
  businessName: 'CAB Premium Detailing',
  links: [
    { href: '#services', label: 'Services' },
    { href: '#portfolio', label: 'Before & After' },
    { href: '#gallery', label: 'Gallery' },
    { href: '#social-showcase', label: 'Reels' },
    { href: '#reviews', label: 'Reviews' },
    { href: '#contact', label: 'Contact' },
  ],
  callButtonLabel: 'Call Now',
  instagramButtonLabel: 'DM on Instagram',
  instagramPendingLabel: 'Instagram DM — coming soon',
};

describe('Nav', () => {
  it('renders a Call Now link using the phoneHref prop', () => {
    render(<Nav {...props} />);
    expect(screen.getByRole('link', { name: props.callButtonLabel })).toHaveAttribute(
      'href',
      props.phoneHref
    );
  });

  it('renders a DM on Instagram link using the instagramDmUrl prop', () => {
    render(<Nav {...props} />);
    expect(screen.getByRole('link', { name: props.instagramButtonLabel })).toHaveAttribute(
      'href',
      props.instagramDmUrl
    );
  });

  it('renders every configured nav link', () => {
    render(<Nav {...props} />);
    for (const link of props.links) {
      expect(screen.getByRole('link', { name: link.label })).toHaveAttribute('href', link.href);
    }
  });

  it('toggles the mobile menu open and closed via the hamburger button', async () => {
    const user = userEvent.setup();
    render(<Nav {...props} />);
    const toggle = screen.getByRole('button', { name: 'Open menu' });
    const nav = screen.getByRole('navigation');

    expect(nav).not.toHaveClass('linksOpen');

    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
    expect(nav.className).toMatch(/linksOpen/);

    await user.click(screen.getByRole('link', { name: 'Contact' }));
    expect(nav.className).not.toMatch(/linksOpen/);
  });

  it('renders the logo with the business name as alt text', () => {
    render(<Nav {...props} />);
    expect(screen.getByAltText(`${props.businessName} logo`)).toHaveAttribute(
      'src',
      props.logoSrc
    );
  });

  it('renders a disabled pending state when instagramDmUrl is null', () => {
    render(<Nav {...props} instagramDmUrl={null} />);
    expect(screen.queryByRole('link', { name: props.instagramButtonLabel })).toBeNull();
    expect(screen.getByText(props.instagramPendingLabel)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run components/Nav.test.tsx`
Expected: FAIL — `Nav` doesn't accept `links`/`callButtonLabel`/`instagramButtonLabel`/`instagramPendingLabel` yet, so the hardcoded English text still differs from what the test now expects (labels match today, so this specifically fails on the "coming soon" pending label prop not being wired, and TypeScript will also flag the extra props as unused/excess once `NavProps` is strict — proceed to Step 3 regardless).

- [ ] **Step 3: Update `components/Nav.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import type { NavLink } from '@/content/site';
import styles from './Nav.module.css';

export interface NavProps {
  phoneDisplay: string;
  phoneHref: string;
  instagramDmUrl: string | null;
  instagramPendingLabel: string;
  logoSrc: string;
  businessName: string;
  links: NavLink[];
  callButtonLabel: string;
  instagramButtonLabel: string;
}

export default function Nav({
  phoneDisplay,
  phoneHref,
  instagramDmUrl,
  instagramPendingLabel,
  logoSrc,
  businessName,
  links,
  callButtonLabel,
  instagramButtonLabel,
}: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
        <button
          type="button"
          className={`${styles.menuToggle} ${menuOpen ? styles.menuToggleOpen : ''}`}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav
          id="primary-navigation"
          className={`${styles.links} ${menuOpen ? styles.linksOpen : ''}`}
        >
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className={styles.cta}>
          <a href={phoneHref} className={styles.btnOutline}>
            {callButtonLabel}
          </a>
          {instagramDmUrl ? (
            <a href={instagramDmUrl} className={styles.btnAccent}>
              {instagramButtonLabel}
            </a>
          ) : (
            <span className={`${styles.btnAccent} ${styles.btnDisabled}`} aria-disabled="true">
              {instagramPendingLabel}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Wire the new props in `app/page.tsx`**

```typescript
<Nav
  phoneDisplay={siteConfig.phoneDisplay}
  phoneHref={siteConfig.phoneHref}
  instagramDmUrl={siteConfig.instagramDmUrl}
  instagramPendingLabel={siteConfig.instagramPendingLabel}
  logoSrc={siteConfig.logoSrc}
  businessName={siteConfig.businessName}
  links={siteConfig.nav.links}
  callButtonLabel={siteConfig.nav.callButtonLabel}
  instagramButtonLabel={siteConfig.nav.instagramButtonLabel}
/>
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/Nav.tsx components/Nav.test.tsx app/page.tsx
git commit -m "feat: make Nav links and button labels config-driven"
```

---

### Task 3: Hero — config-driven badge, headline, subtitle, CTA labels

**Files:**
- Modify: `components/Hero.tsx`
- Modify: `components/Hero.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `siteConfig.hero: HeroConfig`, `siteConfig.instagramPendingLabel: string`.
- Produces: `HeroProps` gains `badge: string`, `headline: string`, `subtitle: string`, `instagramButtonLabel: string`, `callButtonPrefix: string`, `instagramPendingLabel: string`.

- [ ] **Step 1: Update the failing test**

Replace `components/Hero.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Hero from '@/components/Hero';

const props = {
  heroImageSrc: '/images/hero.jpg',
  phoneDisplay: '(406) 609-5321',
  phoneHref: 'tel:+14066095321',
  instagramDmUrl: 'https://instagram.com/direct/inbox/',
  instagramPendingLabel: 'Instagram DM — coming soon',
  badge: 'Mobile & Premium Service',
  headline: 'Premium Detailing for Cars, Airplanes & Boats',
  subtitle: 'Mobile service. Unmatched quality. Restoring high-end vehicles to showroom perfection.',
  instagramButtonLabel: 'Book via Instagram DM',
  callButtonPrefix: 'Call / Text ',
};

describe('Hero', () => {
  it('renders the headline', () => {
    render(<Hero {...props} />);
    expect(screen.getByRole('heading', { name: props.headline })).toBeInTheDocument();
  });

  it('renders a DM CTA linking to instagramDmUrl', () => {
    render(<Hero {...props} />);
    expect(screen.getByRole('link', { name: props.instagramButtonLabel })).toHaveAttribute(
      'href',
      props.instagramDmUrl
    );
  });

  it('renders a call CTA linking to phoneHref and showing the prefix plus phoneDisplay', () => {
    render(<Hero {...props} />);
    const link = screen.getByRole('link', {
      name: `${props.callButtonPrefix}${props.phoneDisplay}`,
    });
    expect(link).toHaveAttribute('href', props.phoneHref);
  });

  it('sets the section id to hero', () => {
    render(<Hero {...props} />);
    expect(document.getElementById('hero')).not.toBeNull();
  });

  it('renders a disabled pending state when instagramDmUrl is null', () => {
    render(<Hero {...props} instagramDmUrl={null} />);
    expect(screen.queryByRole('link', { name: props.instagramButtonLabel })).toBeNull();
    expect(screen.getByText(props.instagramPendingLabel)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run components/Hero.test.tsx`
Expected: FAIL — `Hero` doesn't accept the new props yet.

- [ ] **Step 3: Update `components/Hero.tsx`**

```typescript
import styles from './Hero.module.css';

export interface HeroProps {
  heroImageSrc: string;
  phoneDisplay: string;
  phoneHref: string;
  instagramDmUrl: string | null;
  instagramPendingLabel: string;
  badge: string;
  headline: string;
  subtitle: string;
  instagramButtonLabel: string;
  callButtonPrefix: string;
}

export default function Hero({
  heroImageSrc,
  phoneDisplay,
  phoneHref,
  instagramDmUrl,
  instagramPendingLabel,
  badge,
  headline,
  subtitle,
  instagramButtonLabel,
  callButtonPrefix,
}: HeroProps) {
  return (
    <section id="hero" className={styles.hero}>
      <img src={heroImageSrc} alt="" className={styles.backgroundImage} aria-hidden="true" />
      <div className={styles.scrim} />
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.content}>
        <span className={`${styles.reveal} ${styles.badge}`} style={{ animationDelay: '0ms' }}>
          {badge}
        </span>
        <h1 className={styles.reveal} style={{ animationDelay: '120ms' }}>
          {headline}
        </h1>
        <p className={`${styles.reveal} ${styles.subtitle}`} style={{ animationDelay: '240ms' }}>
          {subtitle}
        </p>
        <div className={`${styles.reveal} ${styles.actions}`} style={{ animationDelay: '360ms' }}>
          {instagramDmUrl ? (
            <a href={instagramDmUrl} className={styles.btnPrimary}>
              {instagramButtonLabel}
            </a>
          ) : (
            <span className={`${styles.btnPrimary} ${styles.btnDisabled}`} aria-disabled="true">
              {instagramPendingLabel}
            </span>
          )}
          <a href={phoneHref} className={styles.btnSecondary}>
            {callButtonPrefix}
            {phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Wire the new props in `app/page.tsx`**

```typescript
<Hero
  heroImageSrc={siteConfig.heroImageSrc}
  phoneDisplay={siteConfig.phoneDisplay}
  phoneHref={siteConfig.phoneHref}
  instagramDmUrl={siteConfig.instagramDmUrl}
  instagramPendingLabel={siteConfig.instagramPendingLabel}
  badge={siteConfig.hero.badge}
  headline={siteConfig.hero.headline}
  subtitle={siteConfig.hero.subtitle}
  instagramButtonLabel={siteConfig.hero.instagramButtonLabel}
  callButtonPrefix={siteConfig.hero.callButtonPrefix}
/>
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/Hero.tsx components/Hero.test.tsx app/page.tsx
git commit -m "feat: make Hero copy config-driven"
```

---

### Task 4: BeforeAfterSection — config-driven heading, subtitle, and view-more labels

**Files:**
- Modify: `components/BeforeAfterSection.tsx`
- Modify: `components/BeforeAfterSection.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `siteConfig.beforeAfter: BeforeAfterConfig` (heading, subtitle, viewMoreTemplate, showFewerLabel — pairs already wired in Task 1).
- Produces: `BeforeAfterSectionProps` gains `heading: string`, `subtitle: string`, `viewMoreTemplate: string`, `showFewerLabel: string`. `viewMoreTemplate` contains the literal substring `{count}`, replaced with the actual remaining count.

- [ ] **Step 1: Update the failing test**

Replace `components/BeforeAfterSection.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BeforeAfterSection from '@/components/BeforeAfterSection';
import { siteConfig } from '@/content/site';

const copyProps = {
  heading: siteConfig.beforeAfter.heading,
  subtitle: siteConfig.beforeAfter.subtitle,
  viewMoreTemplate: siteConfig.beforeAfter.viewMoreTemplate,
  showFewerLabel: siteConfig.beforeAfter.showFewerLabel,
};

describe('BeforeAfterSection', () => {
  it('renders one slider per pair', () => {
    render(<BeforeAfterSection pairs={siteConfig.beforeAfter.pairs} {...copyProps} />);
    expect(screen.getAllByRole('slider')).toHaveLength(siteConfig.beforeAfter.pairs.length);
  });

  it('sets the section id to portfolio', () => {
    render(<BeforeAfterSection pairs={siteConfig.beforeAfter.pairs} {...copyProps} />);
    expect(document.getElementById('portfolio')).not.toBeNull();
  });

  it('renders the configured heading and subtitle', () => {
    render(<BeforeAfterSection pairs={siteConfig.beforeAfter.pairs} {...copyProps} />);
    expect(screen.getByRole('heading', { name: copyProps.heading })).toBeInTheDocument();
    expect(screen.getByText(copyProps.subtitle)).toBeInTheDocument();
  });

  it('renders every pair caption', () => {
    render(<BeforeAfterSection pairs={siteConfig.beforeAfter.pairs} {...copyProps} />);
    for (const pair of siteConfig.beforeAfter.pairs) {
      expect(screen.getByText(pair.caption)).toBeInTheDocument();
    }
  });

  it('renders a view more button that expands the grid when there are more than three pairs', async () => {
    const user = userEvent.setup();
    render(<BeforeAfterSection pairs={siteConfig.beforeAfter.pairs} {...copyProps} />);
    const grid = screen.getAllByRole('slider')[0].closest('[class*="grid"]') as HTMLElement;

    expect(grid.className).not.toMatch(/expanded/);

    const remaining = siteConfig.beforeAfter.pairs.length - 3;
    const expectedLabel = copyProps.viewMoreTemplate.replace('{count}', String(remaining));
    const button = screen.getByRole('button', { name: expectedLabel });
    await user.click(button);

    expect(grid.className).toMatch(/expanded/);
    expect(screen.getByRole('button', { name: copyProps.showFewerLabel })).toBeInTheDocument();
  });

  it('does not render a view more button when there are three or fewer pairs', () => {
    render(<BeforeAfterSection pairs={siteConfig.beforeAfter.pairs.slice(0, 3)} {...copyProps} />);
    expect(
      screen.queryByRole('button', { name: copyProps.viewMoreTemplate.replace('{count}', '') })
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run components/BeforeAfterSection.test.tsx`
Expected: FAIL — `BeforeAfterSection` doesn't accept `heading`/`subtitle`/`viewMoreTemplate`/`showFewerLabel` yet.

- [ ] **Step 3: Update `components/BeforeAfterSection.tsx`**

```typescript
'use client';

import { useState } from 'react';
import type { BeforeAfterPair } from '@/content/site';
import BeforeAfterSlider from './BeforeAfterSlider';
import styles from './BeforeAfterSection.module.css';

export interface BeforeAfterSectionProps {
  pairs: BeforeAfterPair[];
  heading: string;
  subtitle: string;
  viewMoreTemplate: string;
  showFewerLabel: string;
}

const MOBILE_VISIBLE_COUNT = 3;

export default function BeforeAfterSection({
  pairs,
  heading,
  subtitle,
  viewMoreTemplate,
  showFewerLabel,
}: BeforeAfterSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = pairs.length > MOBILE_VISIBLE_COUNT;

  return (
    <section id="portfolio" className={styles.section}>
      <div className={styles.inner}>
        <h2>{heading}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
        <div className={`${styles.grid} ${expanded ? styles.expanded : ''}`}>
          {pairs.map((pair, index) => (
            <div
              key={pair.id}
              className={index >= MOBILE_VISIBLE_COUNT ? styles.extra : undefined}
            >
              <BeforeAfterSlider pair={pair} />
            </div>
          ))}
        </div>
        {hasMore && (
          <button
            type="button"
            className={styles.viewMoreButton}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded
              ? showFewerLabel
              : viewMoreTemplate.replace('{count}', String(pairs.length - MOBILE_VISIBLE_COUNT))}
          </button>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Wire the new props in `app/page.tsx`**

```typescript
<BeforeAfterSection
  pairs={siteConfig.beforeAfter.pairs}
  heading={siteConfig.beforeAfter.heading}
  subtitle={siteConfig.beforeAfter.subtitle}
  viewMoreTemplate={siteConfig.beforeAfter.viewMoreTemplate}
  showFewerLabel={siteConfig.beforeAfter.showFewerLabel}
/>
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/BeforeAfterSection.tsx components/BeforeAfterSection.test.tsx app/page.tsx
git commit -m "feat: make BeforeAfterSection copy config-driven"
```

---

### Task 5: GallerySection — config-driven heading and subtitle

**Files:**
- Modify: `components/GallerySection.tsx`
- Modify: `components/GallerySection.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `siteConfig.gallery.heading: string`, `siteConfig.gallery.subtitle: string` (images already wired in Task 1).
- Produces: `GallerySectionProps` gains `heading: string`, `subtitle: string`.

- [ ] **Step 1: Update the failing test**

Replace `components/GallerySection.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GallerySection from '@/components/GallerySection';

const images = [
  { id: 'a', src: '/images/headlight-restore.jpg', alt: 'Headlight before and after', caption: 'Headlight Restoration' },
];
const heading = 'Gallery';
const subtitle = 'More of our recent work';

describe('GallerySection', () => {
  it('renders every gallery image with its alt text and caption', () => {
    render(<GallerySection images={images} heading={heading} subtitle={subtitle} />);
    for (const image of images) {
      expect(screen.getByAltText(image.alt)).toHaveAttribute('src', image.src);
      expect(screen.getByText(image.caption)).toBeInTheDocument();
    }
  });

  it('renders the configured heading and subtitle', () => {
    render(<GallerySection images={images} heading={heading} subtitle={subtitle} />);
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    expect(screen.getByText(subtitle)).toBeInTheDocument();
  });

  it('sets the section id to gallery', () => {
    render(<GallerySection images={images} heading={heading} subtitle={subtitle} />);
    expect(document.getElementById('gallery')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run components/GallerySection.test.tsx`
Expected: FAIL — `GallerySection` doesn't accept `heading`/`subtitle` yet.

- [ ] **Step 3: Update `components/GallerySection.tsx`**

```typescript
import type { GalleryImage } from '@/content/site';
import styles from './GallerySection.module.css';

export interface GallerySectionProps {
  images: GalleryImage[];
  heading: string;
  subtitle: string;
}

export default function GallerySection({ images, heading, subtitle }: GallerySectionProps) {
  return (
    <section id="gallery" className={styles.section}>
      <div className={styles.inner}>
        <h2>{heading}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
        <div className={styles.grid}>
          {images.map((image) => (
            <figure key={image.id} className={styles.tile}>
              <img src={image.src} alt={image.alt} />
              <figcaption>{image.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Wire the new props in `app/page.tsx`**

```typescript
<GallerySection
  images={siteConfig.gallery.images}
  heading={siteConfig.gallery.heading}
  subtitle={siteConfig.gallery.subtitle}
/>
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/GallerySection.tsx components/GallerySection.test.tsx app/page.tsx
git commit -m "feat: make GallerySection heading/subtitle config-driven"
```

---

### Task 6: ReelsSection — config-driven heading and subtitle

**Files:**
- Modify: `components/ReelsSection.tsx`
- Modify: `components/ReelsSection.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `siteConfig.reels.heading: string`, `siteConfig.reels.subtitle: string` (items already wired in Task 1).
- Produces: `ReelsSectionProps` gains `heading: string`, `subtitle: string`.

- [ ] **Step 1: Update the failing test**

Replace `components/ReelsSection.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReelsSection from '@/components/ReelsSection';
import { siteConfig } from '@/content/site';

describe('ReelsSection', () => {
  it('renders one embedded blockquote per reel, linked to its real Instagram url', () => {
    render(
      <ReelsSection
        reels={siteConfig.reels.items}
        heading={siteConfig.reels.heading}
        subtitle={siteConfig.reels.subtitle}
      />
    );
    for (const reel of siteConfig.reels.items) {
      expect(
        document.querySelector(`blockquote[data-instgrm-permalink="${reel.embedUrl}"]`)
      ).not.toBeNull();
    }
  });

  it('renders the configured heading and subtitle', () => {
    render(
      <ReelsSection
        reels={siteConfig.reels.items}
        heading={siteConfig.reels.heading}
        subtitle={siteConfig.reels.subtitle}
      />
    );
    expect(screen.getByRole('heading', { name: siteConfig.reels.heading })).toBeInTheDocument();
    expect(screen.getByText(siteConfig.reels.subtitle)).toBeInTheDocument();
  });

  it('sets the section id to social-showcase', () => {
    render(
      <ReelsSection
        reels={siteConfig.reels.items}
        heading={siteConfig.reels.heading}
        subtitle={siteConfig.reels.subtitle}
      />
    );
    expect(document.getElementById('social-showcase')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run components/ReelsSection.test.tsx`
Expected: FAIL — `ReelsSection` doesn't accept `heading`/`subtitle` yet.

- [ ] **Step 3: Update `components/ReelsSection.tsx`**

```typescript
import type { ReelItem } from '@/content/site';
import ReelEmbed from './ReelEmbed';
import styles from './ReelsSection.module.css';

export interface ReelsSectionProps {
  reels: ReelItem[];
  heading: string;
  subtitle: string;
}

export default function ReelsSection({ reels, heading, subtitle }: ReelsSectionProps) {
  return (
    <section id="social-showcase" className={styles.section}>
      <div className={styles.inner}>
        <h2>{heading}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
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

- [ ] **Step 4: Wire the new props in `app/page.tsx`**

```typescript
<ReelsSection
  reels={siteConfig.reels.items}
  heading={siteConfig.reels.heading}
  subtitle={siteConfig.reels.subtitle}
/>
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/ReelsSection.tsx components/ReelsSection.test.tsx app/page.tsx
git commit -m "feat: make ReelsSection heading/subtitle config-driven"
```

---

### Task 7: ReviewsCard — config-driven heading, count template, and button labels

**Files:**
- Modify: `components/ReviewsCard.tsx`
- Modify: `components/ReviewsCard.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `siteConfig.googleReview.heading`, `.countTemplate`, `.viewButtonLabel`, `.pendingLabel` (all `string`).
- Produces: `ReviewsCardProps` gains `heading: string`, `countTemplate: string`, `viewButtonLabel: string`, `pendingLabel: string`. `countTemplate` contains the literal substring `{count}`.

- [ ] **Step 1: Update the failing test**

Replace `components/ReviewsCard.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReviewsCard from '@/components/ReviewsCard';

const copyProps = {
  heading: 'What Our Clients Say',
  countTemplate: '({count}+ Google Reviews)',
  viewButtonLabel: 'View on Google',
  pendingLabel: 'Google reviews link coming soon',
};

describe('ReviewsCard', () => {
  it('renders the rating and review count', () => {
    render(<ReviewsCard rating={4.9} reviewCount={50} profileUrl={null} {...copyProps} />);
    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText('(50+ Google Reviews)')).toBeInTheDocument();
  });

  it('renders the configured heading', () => {
    render(<ReviewsCard rating={4.9} reviewCount={50} profileUrl={null} {...copyProps} />);
    expect(screen.getByRole('heading', { name: copyProps.heading })).toBeInTheDocument();
  });

  it('renders a real link when profileUrl is provided', () => {
    render(
      <ReviewsCard
        rating={4.9}
        reviewCount={50}
        profileUrl="https://g.page/cab-detailing"
        {...copyProps}
      />
    );
    expect(screen.getByRole('link', { name: copyProps.viewButtonLabel })).toHaveAttribute(
      'href',
      'https://g.page/cab-detailing'
    );
  });

  it('renders a disabled pending state when profileUrl is null', () => {
    render(<ReviewsCard rating={4.9} reviewCount={50} profileUrl={null} {...copyProps} />);
    expect(screen.queryByRole('link', { name: copyProps.viewButtonLabel })).toBeNull();
    expect(screen.getByText(copyProps.pendingLabel)).toBeInTheDocument();
  });

  it('sets the section id to reviews', () => {
    render(<ReviewsCard rating={4.9} reviewCount={50} profileUrl={null} {...copyProps} />);
    expect(document.getElementById('reviews')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run components/ReviewsCard.test.tsx`
Expected: FAIL — `ReviewsCard` doesn't accept the new copy props yet.

- [ ] **Step 3: Update `components/ReviewsCard.tsx`**

```typescript
import styles from './ReviewsCard.module.css';

export interface ReviewsCardProps {
  rating: number;
  reviewCount: number;
  profileUrl: string | null;
  heading: string;
  countTemplate: string;
  viewButtonLabel: string;
  pendingLabel: string;
}

export default function ReviewsCard({
  rating,
  reviewCount,
  profileUrl,
  heading,
  countTemplate,
  viewButtonLabel,
  pendingLabel,
}: ReviewsCardProps) {
  const filledStars = Math.round(rating);
  return (
    <section id="reviews" className={styles.section}>
      <div className={styles.card}>
        <h2>{heading}</h2>
        <div className={styles.rating}>
          <span className={styles.score}>{rating.toFixed(1)}</span>
          <span className={styles.stars} aria-hidden="true">
            {'★'.repeat(filledStars)}
            {'☆'.repeat(5 - filledStars)}
          </span>
          <span className={styles.count}>{countTemplate.replace('{count}', String(reviewCount))}</span>
        </div>
        {profileUrl ? (
          <a href={profileUrl} className={styles.btnGoogle}>
            {viewButtonLabel}
          </a>
        ) : (
          <span className={`${styles.btnGoogle} ${styles.btnDisabled}`} aria-disabled="true">
            {pendingLabel}
          </span>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Wire the new props in `app/page.tsx`**

```typescript
<ReviewsCard
  rating={siteConfig.googleReview.rating}
  reviewCount={siteConfig.googleReview.reviewCount}
  profileUrl={siteConfig.googleReview.profileUrl}
  heading={siteConfig.googleReview.heading}
  countTemplate={siteConfig.googleReview.countTemplate}
  viewButtonLabel={siteConfig.googleReview.viewButtonLabel}
  pendingLabel={siteConfig.googleReview.pendingLabel}
/>
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/ReviewsCard.tsx components/ReviewsCard.test.tsx app/page.tsx
git commit -m "feat: make ReviewsCard copy config-driven"
```

---

### Task 8: PricingSection — config-driven headings/subtitles, and render the missing standaloneCaveat

**Files:**
- Modify: `components/PricingSection.tsx`
- Modify: `components/PricingSection.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `siteConfig.pricing.heading`, `.subtitle`, `.standaloneHeading`, `.standaloneSubtitle`, `.standaloneCaveat`, `.quoteHeading`, `.quoteSubtitle`, `.quoteFactorsLabel`, `.addonsHeading`, `.addonsSubtitle` (all `string`).
- Produces: `PricingSectionProps` gains `heading`, `subtitle`, `standaloneHeading`, `standaloneSubtitle`, `standaloneCaveat`, `quoteHeading`, `quoteSubtitle`, `quoteFactorsLabel`, `addonsHeading`, `addonsSubtitle` (all `string`).

- [ ] **Step 1: Update the failing test**

Replace `components/PricingSection.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PricingSection from '@/components/PricingSection';
import { siteConfig } from '@/content/site';

const props = {
  packages: siteConfig.pricing.packages,
  standaloneOptions: siteConfig.pricing.standaloneOptions,
  quoteServices: siteConfig.pricing.quoteServices,
  items: siteConfig.pricing.addons,
  heading: siteConfig.pricing.heading,
  subtitle: siteConfig.pricing.subtitle,
  standaloneHeading: siteConfig.pricing.standaloneHeading,
  standaloneSubtitle: siteConfig.pricing.standaloneSubtitle,
  standaloneCaveat: siteConfig.pricing.standaloneCaveat,
  quoteHeading: siteConfig.pricing.quoteHeading,
  quoteSubtitle: siteConfig.pricing.quoteSubtitle,
  quoteFactorsLabel: siteConfig.pricing.quoteFactorsLabel,
  addonsHeading: siteConfig.pricing.addonsHeading,
  addonsSubtitle: siteConfig.pricing.addonsSubtitle,
};

describe('PricingSection', () => {
  it('renders every add-on item name and price', () => {
    render(<PricingSection {...props} />);
    for (const item of props.items) {
      expect(screen.getByText(item.name)).toBeInTheDocument();
      expect(screen.getByText(item.price)).toBeInTheDocument();
    }
  });

  it('renders every package name, price, and checklist items as text', () => {
    render(<PricingSection {...props} />);
    for (const pkg of props.packages) {
      expect(screen.getByRole('heading', { name: pkg.name })).toBeInTheDocument();
      expect(screen.getAllByText(pkg.price).length).toBeGreaterThan(0);
      for (const checklist of pkg.checklists) {
        expect(screen.getByText(checklist.heading)).toBeInTheDocument();
        for (const item of checklist.items) {
          expect(screen.getAllByText(item).length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('renders a booking link for every package that points at #contact', () => {
    render(<PricingSection {...props} />);
    for (const pkg of props.packages) {
      const link = screen.getByRole('link', { name: pkg.ctaLabel });
      expect(link).toHaveAttribute('href', '#contact');
    }
  });

  it('renders every standalone option name and price', () => {
    render(<PricingSection {...props} />);
    for (const option of props.standaloneOptions) {
      expect(screen.getByText(option.name)).toBeInTheDocument();
      expect(screen.getAllByText(option.price).length).toBeGreaterThan(0);
    }
  });

  it('renders the standalone pricing caveat', () => {
    render(<PricingSection {...props} />);
    expect(screen.getAllByText(props.standaloneCaveat).length).toBeGreaterThan(0);
  });

  it('renders every quote service name, starting price, and pricing factors', () => {
    render(<PricingSection {...props} />);
    for (const service of props.quoteServices) {
      expect(screen.getByRole('heading', { name: service.name })).toBeInTheDocument();
      expect(screen.getByText(service.startingPrice)).toBeInTheDocument();
      for (const factor of service.factors) {
        expect(screen.getAllByText(factor).length).toBeGreaterThan(0);
      }
    }
  });

  it('renders all configured headings and subtitles', () => {
    render(<PricingSection {...props} />);
    expect(screen.getByRole('heading', { name: props.heading })).toBeInTheDocument();
    expect(screen.getByText(props.subtitle)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: props.standaloneHeading })).toBeInTheDocument();
    expect(screen.getByText(props.standaloneSubtitle)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: props.quoteHeading })).toBeInTheDocument();
    expect(screen.getByText(props.quoteSubtitle)).toBeInTheDocument();
    expect(screen.getAllByText(props.quoteFactorsLabel).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: props.addonsHeading })).toBeInTheDocument();
    expect(screen.getByText(props.addonsSubtitle)).toBeInTheDocument();
  });

  it('sets the section id to services', () => {
    render(<PricingSection {...props} />);
    expect(document.getElementById('services')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run components/PricingSection.test.tsx`
Expected: FAIL — the "renders all configured headings and subtitles" and "renders the standalone pricing caveat" tests fail because `PricingSection` doesn't accept those props / doesn't render the caveat yet.

- [ ] **Step 3: Update `components/PricingSection.tsx`**

```typescript
import type { PricingItem, PricingPackage, QuoteService, StandaloneOption } from '@/content/site';
import styles from './PricingSection.module.css';

export interface PricingSectionProps {
  packages: PricingPackage[];
  standaloneOptions: StandaloneOption[];
  quoteServices: QuoteService[];
  items: PricingItem[];
  heading: string;
  subtitle: string;
  standaloneHeading: string;
  standaloneSubtitle: string;
  standaloneCaveat: string;
  quoteHeading: string;
  quoteSubtitle: string;
  quoteFactorsLabel: string;
  addonsHeading: string;
  addonsSubtitle: string;
}

export default function PricingSection({
  packages,
  standaloneOptions,
  quoteServices,
  items,
  heading,
  subtitle,
  standaloneHeading,
  standaloneSubtitle,
  standaloneCaveat,
  quoteHeading,
  quoteSubtitle,
  quoteFactorsLabel,
  addonsHeading,
  addonsSubtitle,
}: PricingSectionProps) {
  return (
    <section id="services" className={styles.section}>
      <div className={styles.inner}>
        <h2>{heading}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
        <div className={styles.packages}>
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`${styles.packageCard} ${pkg.highlight ? styles.packageHighlight : ''}`}
            >
              {pkg.tagline && <p className={styles.packageTagline}>{pkg.tagline}</p>}
              <h3>{pkg.name}</h3>
              <strong className={styles.packagePrice}>{pkg.price}</strong>
              <p className={styles.savingsNote}>{pkg.savingsNote}</p>
              <p className={styles.description}>{pkg.description}</p>
              {pkg.checklists.map((checklist) => (
                <div key={checklist.heading} className={styles.checklist}>
                  <h4 className={styles.checklistHeading}>{checklist.heading}</h4>
                  {checklist.note && <p className={styles.checklistNote}>{checklist.note}</p>}
                  <ul className={styles.featureList}>
                    {checklist.items.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className={styles.priceNote}>{pkg.pricingCaveat}</p>
              <a href="#contact" className={styles.ctaButton}>
                {pkg.ctaLabel}
              </a>
            </div>
          ))}
        </div>

        <h3 className={styles.standaloneHeading}>{standaloneHeading}</h3>
        <p className={styles.subtitle}>{standaloneSubtitle}</p>
        <ul className={styles.list}>
          {standaloneOptions.map((option) => (
            <li key={option.id}>
              {option.groupLabel && <p className={styles.groupLabel}>{option.groupLabel}</p>}
              <div className={styles.item}>
                <span>{option.name}</span>
                <strong className={styles.price}>{option.price}</strong>
              </div>
            </li>
          ))}
        </ul>
        <p className={styles.priceNote}>{standaloneCaveat}</p>

        <h3 className={styles.addonsHeading}>{quoteHeading}</h3>
        <p className={styles.subtitle}>{quoteSubtitle}</p>
        <div className={styles.quoteServices}>
          {quoteServices.map((service) => (
            <div key={service.id} className={styles.quoteCard}>
              {service.tagline && <p className={styles.packageTagline}>{service.tagline}</p>}
              <h3>{service.name}</h3>
              <strong className={styles.packagePrice}>{service.startingPrice}</strong>
              <p className={styles.description}>{service.description}</p>
              <p className={styles.checklistNote}>{quoteFactorsLabel}</p>
              <ul className={styles.featureList}>
                {service.factors.map((factor) => (
                  <li key={factor}>{factor}</li>
                ))}
              </ul>
              <p className={styles.priceNote}>{service.note}</p>
              <a href="#contact" className={styles.ctaButton}>
                {service.ctaLabel}
              </a>
            </div>
          ))}
        </div>

        <h3 className={styles.addonsHeading}>{addonsHeading}</h3>
        <p className={styles.subtitle}>{addonsSubtitle}</p>
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
      </div>
    </section>
  );
}
```

Every visible string in this component is now config-driven, including the "Pricing varies depending on:" label (`quoteFactorsLabel`).

- [ ] **Step 4: Wire the new props in `app/page.tsx`**

```typescript
<PricingSection
  packages={siteConfig.pricing.packages}
  standaloneOptions={siteConfig.pricing.standaloneOptions}
  quoteServices={siteConfig.pricing.quoteServices}
  items={siteConfig.pricing.addons}
  heading={siteConfig.pricing.heading}
  subtitle={siteConfig.pricing.subtitle}
  standaloneHeading={siteConfig.pricing.standaloneHeading}
  standaloneSubtitle={siteConfig.pricing.standaloneSubtitle}
  standaloneCaveat={siteConfig.pricing.standaloneCaveat}
  quoteHeading={siteConfig.pricing.quoteHeading}
  quoteSubtitle={siteConfig.pricing.quoteSubtitle}
  quoteFactorsLabel={siteConfig.pricing.quoteFactorsLabel}
  addonsHeading={siteConfig.pricing.addonsHeading}
  addonsSubtitle={siteConfig.pricing.addonsSubtitle}
/>
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/PricingSection.tsx components/PricingSection.test.tsx app/page.tsx
git commit -m "feat: make PricingSection headings config-driven; render standaloneCaveat"
```

---

### Task 9: ContactSection — config-driven heading, body, and CTA labels

**Files:**
- Modify: `components/ContactSection.tsx`
- Modify: `components/ContactSection.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `siteConfig.contact: ContactConfig`, `siteConfig.instagramPendingLabel: string`.
- Produces: `ContactSectionProps` gains `heading: string`, `body: string`, `instagramButtonLabel: string`, `callButtonPrefix: string`, `instagramPendingLabel: string`.

- [ ] **Step 1: Update the failing test**

Replace `components/ContactSection.test.tsx`:

```typescript
// components/ContactSection.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContactSection from '@/components/ContactSection';

const props = {
  instagramDmUrl: 'https://instagram.com/direct/inbox/',
  phoneDisplay: '(406) 609-5321',
  phoneHref: 'tel:+14066095321',
  instagramPendingLabel: 'Instagram DM — coming soon',
  heading: 'Ready to Book Your Detail?',
  body: 'DM us on Instagram or call/text to discuss pricing and schedule your appointment.',
  instagramButtonLabel: 'DM Us on Instagram',
  callButtonPrefix: 'Call / Text ',
};

describe('ContactSection', () => {
  it('renders the configured heading and body', () => {
    render(<ContactSection {...props} />);
    expect(screen.getByRole('heading', { name: props.heading })).toBeInTheDocument();
    expect(screen.getByText(props.body)).toBeInTheDocument();
  });

  it('renders a DM CTA linking to instagramDmUrl', () => {
    render(<ContactSection {...props} />);
    expect(screen.getByRole('link', { name: props.instagramButtonLabel })).toHaveAttribute(
      'href',
      props.instagramDmUrl
    );
  });

  it('renders a call CTA linking to phoneHref and showing the prefix plus phoneDisplay', () => {
    render(<ContactSection {...props} />);
    const link = screen.getByRole('link', {
      name: `${props.callButtonPrefix}${props.phoneDisplay}`,
    });
    expect(link).toHaveAttribute('href', props.phoneHref);
  });

  it('sets the section id to contact', () => {
    render(<ContactSection {...props} />);
    expect(document.getElementById('contact')).not.toBeNull();
  });

  it('renders a disabled pending state when instagramDmUrl is null', () => {
    render(<ContactSection {...props} instagramDmUrl={null} />);
    expect(screen.queryByRole('link', { name: props.instagramButtonLabel })).toBeNull();
    expect(screen.getByText(props.instagramPendingLabel)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run components/ContactSection.test.tsx`
Expected: FAIL — `ContactSection` doesn't accept the new copy props yet.

- [ ] **Step 3: Update `components/ContactSection.tsx`**

```typescript
import styles from './ContactSection.module.css';

export interface ContactSectionProps {
  instagramDmUrl: string | null;
  phoneDisplay: string;
  phoneHref: string;
  instagramPendingLabel: string;
  heading: string;
  body: string;
  instagramButtonLabel: string;
  callButtonPrefix: string;
}

export default function ContactSection({
  instagramDmUrl,
  phoneDisplay,
  phoneHref,
  instagramPendingLabel,
  heading,
  body,
  instagramButtonLabel,
  callButtonPrefix,
}: ContactSectionProps) {
  return (
    <section id="contact" className={styles.section}>
      <div className={styles.inner}>
        <h2>{heading}</h2>
        <p>{body}</p>
        <div className={styles.actions}>
          {instagramDmUrl ? (
            <a href={instagramDmUrl} className={styles.btnInstagram}>
              {instagramButtonLabel}
            </a>
          ) : (
            <span className={`${styles.btnInstagram} ${styles.btnDisabled}`} aria-disabled="true">
              {instagramPendingLabel}
            </span>
          )}
          <a href={phoneHref} className={styles.btnPhone}>
            {callButtonPrefix}
            {phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Wire the new props in `app/page.tsx`**

```typescript
<ContactSection
  instagramDmUrl={siteConfig.instagramDmUrl}
  phoneDisplay={siteConfig.phoneDisplay}
  phoneHref={siteConfig.phoneHref}
  instagramPendingLabel={siteConfig.instagramPendingLabel}
  heading={siteConfig.contact.heading}
  body={siteConfig.contact.body}
  instagramButtonLabel={siteConfig.contact.instagramButtonLabel}
  callButtonPrefix={siteConfig.contact.callButtonPrefix}
/>
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/ContactSection.tsx components/ContactSection.test.tsx app/page.tsx
git commit -m "feat: make ContactSection copy config-driven"
```

---

### Task 10: Footer — config-driven copyright suffix and social labels; final verification

**Files:**
- Modify: `components/Footer.tsx`
- Modify: `components/Footer.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `siteConfig.footer: FooterConfig`, `siteConfig.instagramPendingLabel: string`.
- Produces: `FooterProps` gains `copyrightSuffix: string`, `instagramLabel: string`, `googleLabel: string`, `instagramPendingLabel: string`.

- [ ] **Step 1: Update the failing test**

Replace `components/Footer.test.tsx`:

```typescript
// components/Footer.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';

const baseProps = {
  logoSrc: '/images/logo.jpg',
  businessName: 'CAB Premium Detailing',
  instagramDmUrl: 'https://instagram.com/direct/inbox/',
  instagramPendingLabel: 'Instagram DM — coming soon',
  copyrightSuffix: 'All rights reserved.',
  instagramLabel: 'Instagram',
  googleLabel: 'Google Page',
};

describe('Footer', () => {
  it('renders an Instagram link using instagramDmUrl', () => {
    render(<Footer {...baseProps} googleProfileUrl={null} />);
    expect(screen.getByRole('link', { name: baseProps.instagramLabel })).toHaveAttribute(
      'href',
      baseProps.instagramDmUrl
    );
  });

  it('omits the Google Page link when googleProfileUrl is null', () => {
    render(<Footer {...baseProps} googleProfileUrl={null} />);
    expect(screen.queryByRole('link', { name: baseProps.googleLabel })).toBeNull();
  });

  it('renders the Google Page link when googleProfileUrl is provided', () => {
    render(<Footer {...baseProps} googleProfileUrl="https://g.page/cab-detailing" />);
    expect(screen.getByRole('link', { name: baseProps.googleLabel })).toHaveAttribute(
      'href',
      'https://g.page/cab-detailing'
    );
  });

  it('renders the current year and the configured copyright suffix', () => {
    render(<Footer {...baseProps} googleProfileUrl={null} />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(baseProps.copyrightSuffix))).toBeInTheDocument();
  });

  it('renders a disabled pending state when instagramDmUrl is null', () => {
    render(<Footer {...baseProps} instagramDmUrl={null} googleProfileUrl={null} />);
    expect(screen.queryByRole('link', { name: baseProps.instagramLabel })).toBeNull();
    expect(screen.getByText(baseProps.instagramPendingLabel)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run components/Footer.test.tsx`
Expected: FAIL — `Footer` doesn't accept the new copy props yet.

- [ ] **Step 3: Update `components/Footer.tsx`**

```typescript
import styles from './Footer.module.css';

export interface FooterProps {
  logoSrc: string;
  businessName: string;
  instagramDmUrl: string | null;
  googleProfileUrl: string | null;
  instagramPendingLabel: string;
  copyrightSuffix: string;
  instagramLabel: string;
  googleLabel: string;
}

export default function Footer({
  logoSrc,
  businessName,
  instagramDmUrl,
  googleProfileUrl,
  instagramPendingLabel,
  copyrightSuffix,
  instagramLabel,
  googleLabel,
}: FooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <img src={logoSrc} alt={`${businessName} logo`} className={styles.logo} />
        <p>
          © {year} {businessName}. {copyrightSuffix}
        </p>
        <div className={styles.social}>
          {instagramDmUrl ? (
            <a href={instagramDmUrl}>{instagramLabel}</a>
          ) : (
            <span className={styles.disabled} aria-disabled="true">
              {instagramPendingLabel}
            </span>
          )}
          {googleProfileUrl && <a href={googleProfileUrl}>{googleLabel}</a>}
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Wire the new props in `app/page.tsx`**

```typescript
<Footer
  logoSrc={siteConfig.logoSrc}
  businessName={siteConfig.businessName}
  instagramDmUrl={siteConfig.instagramDmUrl}
  googleProfileUrl={siteConfig.googleReview.profileUrl}
  instagramPendingLabel={siteConfig.instagramPendingLabel}
  copyrightSuffix={siteConfig.footer.copyrightSuffix}
  instagramLabel={siteConfig.footer.instagramLabel}
  googleLabel={siteConfig.footer.googleLabel}
/>
```

- [ ] **Step 5: Run the full suite, typecheck, and production build**

Run: `npx vitest run`
Expected: all tests PASS (every component test file plus `content/site.test.ts` and `app/page.test.tsx`).

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `GITHUB_PAGES=true npm run build`
Expected: build succeeds and produces `out/` — this confirms the content-model rework hasn't broken the current GitHub Pages deploy path, which this plan intentionally leaves untouched.

- [ ] **Step 6: Commit**

```bash
git add components/Footer.tsx components/Footer.test.tsx app/page.tsx
git commit -m "feat: make Footer copy config-driven"
```

---

## Self-review notes

- **Spec coverage:** This plan implements spec section 2 ("Content model") in full — every hardcoded string identified during brainstorming (nav links/buttons, hero copy, all section headings/subtitles, footer copy, the shared Instagram-pending label) is now sourced from `content/site.json`. Spec sections 1 (hosting), 3 (auth), 4 (admin UI), and 5 (publish flow) are deliberately out of scope for this plan — they're the follow-up plan noted in the spec's approach.
- **Placeholder scan:** No TBDs; every step has real, complete code.
- **Type consistency:** `PricingSectionProps`, `NavProps`, etc. are defined once (in their component task) and their exact field names are reused verbatim in `app/page.tsx`'s wiring step within the same task — checked against the Task 1 `SiteConfig` interface for name/shape match.
- **Scope check:** Single subsystem (content model), ready to execute as one plan.

---

## Next plan

Once this lands, the follow-up plan (`Vercel migration + auth + admin UI + publish API`, per the spec) builds the actual editor on top of this content-model shape.
