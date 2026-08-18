# CAB Premium Detailing — Website Design

Date: 2026-08-18

## Purpose

A single-page marketing site for CAB (Car, Airplane & Boat) Premium
Detailing — a mobile premium-detailing service. Goals: showcase real
before/after work, drive contact via phone call or Instagram DM,
surface pricing/add-ons, and build trust via a real Google rating
link. Starting point was a hand-drafted HTML/CSS blueprint (dark
theme, blue accent, card-based before/after, fabricated review
quotes, generic TikTok/Instagram placeholders) — this spec keeps the
blueprint's content structure but replaces the generic-template visual
treatment and removes fabricated content.

## Tech Stack

- **Framework**: Next.js (App Router) + TypeScript.
- **Styling**: CSS variables for design tokens (colors, type, spacing,
  radii) + CSS Modules per component. No UI framework dependency.
- **No backend/CMS** — chosen for future flexibility, not because a
  concrete dynamic feature is planned yet. Content is static at build
  time, centralized in one config file for easy editing.

Rationale: plain static HTML/CSS/JS was considered and would have
been simpler for this scope, but the user explicitly wants the option
to add dynamic features (booking form, CMS) later without a rewrite.

## Deployment

- **Now**: GitHub Pages via Next static export.
  - `next.config.js`: `output: 'export'`, with `basePath` /
    `assetPrefix` conditioned on a `GITHUB_PAGES` env var so the build
    works at `username.github.io/repo-name`.
  - GitHub Actions workflow builds on push to `main` and publishes to
    the `gh-pages` branch / Pages environment.
- **Later (optional)**: move to Vercel for full SSR — remove the
  `output: 'export'` block and the `basePath` conditional; no other
  rewrite needed.
- **Custom domain**: not yet purchased. No blocking setup required now
  — add a `CNAME` file / DNS config when the domain exists.
- Since static export disables Next's image-optimization server,
  large source photos (e.g. `CardoorAfter.png` at ~3.6MB) must be
  pre-compressed at build time, or `next/image` used with
  `unoptimized: true`.

## Visual System — "After-Hours Showroom"

The direction: real photography as the centerpiece, moody dark
staging, one decisive accent color (not a soft same-hue glow wash).

- **Background**: true neutral near-black/charcoal — NOT blue- or
  navy-tinted. This is what lets the accent color read as intentional
  instead of blending into a monochrome wash (the failure mode of the
  original blueprint, where `--bg-dark` and the accent blue were the
  same hue family).
- **Primary accent**: `#1D3ED1` (decisive cobalt blue), used sharply —
  solid fills, crisp borders, CTAs, active states, key numbers/tags.
  Avoid diffuse radial-glow gradients as a background treatment; use
  it as a targeted spotlight (e.g. behind the hero headline) rather
  than washed across every card.
- **Secondary accent**: brushed-metal/chrome, used for badges,
  dividers, and the logo treatment — reinforces the
  automotive/aviation/marine "premium detailing" feel and keeps the
  palette from being mono-blue.
- **Typography**:
  - Display/headlines/pricing numbers: **Fraunces** (variable serif,
    editorial, characterful).
  - Body/UI/nav/labels: **Karla** (workhorse sans; uppercase-tracked
    for tags/eyebrows).
  - Explicitly avoid Inter/Roboto/Arial/system-default and other
    overused AI-template faces per project aesthetic guidance
    (`CLAUDE.md`).
- **Motion**:
  - One orchestrated staggered reveal on hero load (badge → headline
    → subhead → CTAs cascade in via `animation-delay`).
  - Before/after comparisons are a real drag-slider interaction (not a
    hover swap).
  - Cobalt spotlight glow behind hero imagery, subtle shift on
    scroll/mouse position.
  - Hover states use a soft light bloom rather than a flat color
    swap.

## Site Structure

Single page, anchor-nav, matching the original blueprint's section
order: Nav → Hero → Before/After → Reels → Reviews → Add-ons/Pricing →
Contact → Footer.

### Content config

All editable business content lives in one file, `content/site.ts`:

- Phone number: `(406) 609-5321` (confirmed real).
- Instagram handle — **placeholder, to be supplied by user**; current
  blueprint's generic `instagram.com/direct/inbox/` link must be
  replaced with the real profile/DM link once provided.
- Google Business Profile URL + star rating + review count —
  **placeholder, to be supplied by user** (see Reviews section below).
- TikTok/Instagram reel URLs — **placeholder, to be supplied by
  user** (see Reels section below).
- Before/after image pairs (see Image Mapping below).
- Pricing/add-ons list (carried over from blueprint: Headlight
  Restoration $80–$120, Heavy Pet Hair Removal from $40, Ceramic Spray
  Protection $60–$75, Odor Elimination $50).

### Image mapping

Source images live in `imgs/`. The original blueprint referenced only
3 before/after pairs under placeholder filenames
(`assets/CardoorBefore.jpg`, etc.) that don't match the real files.
Actual available pairs (6, not 3) to be featured:

| Pair | Before | After |
|---|---|---|
| Car door | `DriverdoorBefore.jpg` | `DriverdoorAfter.jpg` |
| Passenger area | `PassengerBefore.jpg` | `PassengerAfter.jpg` |
| Behind seats/floor mats | `BehindBefore.jpg` | `BehindAfter.jpg` |
| Cargo/boot 1 | `Boot1Before.jpg` | `Boot1After.jpg` |
| Cargo/boot 2 | `Boot2Before.jpg` | `Boot2After.jpg` |
| Car door (panel) | `CardoorBeforepng.png` | `CardoorAfter.png` |

Other assets: `HeroAdvertImage.jpg` (hero background), `CABLogo.jpg`
(nav/footer logo mark), `Addons.jpg` / `Prices.jpg` /
`HeadlightRestore.jpg` / `Details.png` (supporting imagery in the
pricing/add-ons section).

## Section-by-Section Breakdown

- **Nav**: sticky, translucent-dark on scroll. `CABLogo.jpg` mark +
  wordmark. Anchor links (Services / Before & After / Reels / Reviews
  / Contact). "Call Now" (`tel:`) + "DM on Instagram" button pair
  (outlined / filled).
- **Hero**: full-bleed `HeroAdvertImage.jpg` with dark gradient scrim
  for text legibility. Staggered reveal animation. Cobalt spotlight
  glow anchored behind the headline. CTAs: DM on Instagram, Call/Text.
- **Before/After**: all 6 real pairs from the table above, rendered as
  large drag-slider comparisons (not small boxed cards) — draggable
  divider, Before/After tags, one caption per pair describing the
  work done.
- **Reels**: 9:16 frames. Real Instagram/TikTok embeds via oEmbed once
  URLs are supplied. Until then, rendered as clearly-labeled
  "coming soon" placeholders — NOT the blueprint's broken
  `iframe src="about:blank"` pattern, so nothing looks broken
  pre-launch.
- **Reviews**: a link-out rating card — star rating + review count
  (from config) plus a "View on Google" button linking to the real
  Google Business Profile. No fabricated review quotes (the original
  blueprint's 3 "Verified Google Customer" quotes are fictional and
  must not ship). Rationale: a free official Google reviews embed
  doesn't exist; third-party embed widgets (Elfsight etc.) are
  typically paid subscriptions, so the link-out card was chosen as the
  free, zero-dependency option that still shows only real content.
- **Add-ons/Pricing**: styled list from config, paired with supporting
  imagery (`Prices.jpg`, `Addons.jpg`, `HeadlightRestore.jpg`).
- **Contact/CTA + Footer**: mirrors the blueprint — large DM/Call
  buttons, logo, social links, copyright line.

## QA Before Launch

- Responsive check at mobile/tablet/desktop breakpoints.
- Lighthouse pass (performance/accessibility/SEO).
- Verify all CTAs (`tel:`, Instagram) resolve correctly.
- Verify the drag-slider before/after interaction works on touch
  devices, not just mouse.
- Confirm all placeholder content (reel embeds, review count,
  Instagram handle, custom domain) is either filled in with real
  values or clearly marked as pending, before the site is considered
  launch-ready.

## Open Items (need real values from user before launch)

1. Real Instagram handle/profile URL (for DM links and reel embeds).
2. Google Business Profile URL + current star rating + review count.
3. Real Instagram/TikTok reel URLs to embed in the Reels section.
4. Custom domain, once purchased (no blocking setup required now).
