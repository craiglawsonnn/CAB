# Admin CMS — Design

## Goal

Ania (the site owner) can log into a password-protected admin page and edit every piece of visible text and every image on the site herself, without touching code. Saving publishes the change to the live site automatically.

## Context / constraints

- The site is currently a fully static Next.js export (`output: 'export'`), deployed to GitHub Pages via `.github/workflows/deploy.yml` on push to `main`. There is no server and no database — nothing to authenticate against or persist edits to.
- All current content lives in `content/site.ts` (a typed TS object). A meaningful amount of visible text is still hardcoded directly in component JSX (nav labels, section headings, the hero headline/subtitle, button/CTA copy, footer copy).
- Owner (craiglawsonnn) is comfortable with Vercel as a hosting target but has no prior Vercel experience — implementation must include a walkthrough of the Vercel setup steps.
- Single admin user (Ania). One shared password is sufficient; no multi-user accounts needed.
- Full image list management is required: add, remove, and reorder photos in the Gallery and Before/After sections, not just replacing fixed slots.
- "Editable text" scope = literally every visible string on the page, including structural labels (nav links, section headings, button text), not just the content that already lives in `content/site.ts`.

## Non-goals

- No multi-user accounts / roles.
- No draft/preview-before-publish workflow — Save publishes directly (with a short deploy delay).
- No WYSIWYG rich-text editing — fields are plain text/textarea, matching the site's existing plain-string content model.
- No built-in edit history/versioning UI — git history on `main` serves as the audit trail if ever needed.

## Approach

Move hosting to Vercel (still free tier) so the app has a real server for authentication and for holding secrets. Content is restructured into a single `content/site.json` file — the actual source of truth — with `content/site.ts` reduced to a thin typed loader over it, so every existing typed `siteConfig.foo` access keeps working. Saving from the admin UI builds one atomic git commit (via the GitHub API, using a server-side-only token) containing the updated JSON plus any added/changed/removed image files, and pushes it to `main`. Vercel's GitHub integration auto-deploys on that commit — no separate publish step, no database, no blob storage service. This keeps the entire content history readable and revertible via ordinary git tooling.

## 1. Hosting migration

- Create a Vercel project connected to this GitHub repo (owner will do this in the Vercel dashboard; implementation phase includes a step-by-step walkthrough since owner is new to Vercel).
- Remove `output: 'export'`, `images.unoptimized`, and the GitHub Pages `basePath`/`assetPrefix` logic from `next.config.js` — Vercel serves Next.js natively.
- Remove `.github/workflows/deploy.yml` and the GitHub Pages publishing source; Vercel's own GitHub integration becomes the sole deploy path (deploys automatically on every push to `main`, including the commits the admin API creates).
- `lib/basePath.ts` and its usages in `content/site.ts` become unnecessary (no basePath on Vercel) and should be removed as part of the content-model rework, not left as dead code.
- No custom domain is configured today (no `CNAME` file), so this is a plain URL change to `*.vercel.app` unless the owner adds a custom domain later — out of scope for this spec.

## 2. Content model

- New file `content/site.json` holds all editable content: everything currently in `siteConfig`, plus newly-in-scope fields such as:
  - Hero: badge text, headline, subtitle, button labels.
  - Nav: link labels, "Call Now"/"DM on Instagram" button labels.
  - Section headings and subtitles across Pricing, Gallery, Before/After, Reels, Reviews, Contact ("Packages & Pricing", "Only Need One?", "Ready to Book Your Detail?", etc.).
  - Footer copy.
  - CTA/button labels that are currently hardcoded JSX text (e.g. "DM Us on Instagram", "Call / Text {phone}").
- `content/site.ts` imports `site.json`, applies the existing TypeScript interfaces (extended to cover the new fields), and exports `siteConfig` exactly as it does today — consuming components that already read `siteConfig.x` need no changes for fields that already existed.
- Every component that currently hardcodes now-editable strings (`Nav`, `Hero`, `PricingSection`, `ContactSection`, `Footer`, `ReviewsCard`, `GallerySection`, `ReelsSection`, `BeforeAfterSection`) is updated to accept those strings as props instead. This is the largest mechanical piece of the implementation — no single file is complex, but most components get touched.
- Each list entry (packages, checklist items, standalone options, quote services, add-ons, gallery images, before/after pairs, reels) already has, or gains, a stable `id` — needed for admin add/remove/reorder and for mapping images to files on disk.

## 3. Authentication

- `ADMIN_PASSWORD_HASH` (bcrypt hash) and `SESSION_SECRET` stored as Vercel environment variables — never committed to git.
- `POST /api/admin/login`: accepts a password, compares against the stored hash, and on success sets an httpOnly, `Secure`, `SameSite=Lax` cookie containing a signed, expiring session token (stateless — no session table needed). On failure, increments a lightweight in-memory failure counter keyed by IP; after 5 failures, further attempts are rejected for a cooldown window (this resets on redeploy/cold start — acceptable, since it's a deterrent, not the primary defense).
- `middleware.ts` guards every `/admin/*` page and every `/api/admin/*` route except `/api/admin/login`, redirecting unauthenticated requests to the login page.
- Session cookie expires after 24 hours. A "Log out" control in the admin UI clears it.

## 4. Admin UI

- Single dashboard at `/admin`, collapsible sections mirroring the live page's order: Site Basics, Nav, Hero, Before/After, Gallery, Reels, Reviews, Pricing (packages + checklists, standalone options, quote services, add-ons), Contact, Footer.
- Plain fields (name, phone, headings, descriptions, captions, etc.) are labeled text inputs or textareas bound to local component state.
- Repeatable collections (gallery photos, before/after pairs, packages, checklist items, standalone options, quote services, add-ons) render as a list of cards, each with **Remove** and **Move up / Move down** controls, plus an **Add** control at the end of the list. Move-up/down (not drag-and-drop) is a deliberate simplicity choice — more reliable across devices/input methods for short lists.
- Each image field renders its current photo as a thumbnail with a **Replace** control (file picker → immediate local preview via object URL, staged in memory) and, for list entries, a **Remove** control that deletes the whole entry.
- All edits accumulate in local state only. A single sticky **Save & Publish** button (visible while scrolling) submits everything at once as one commit. Navigating away with unsaved changes prompts a confirmation dialog (`beforeunload`).
- After a successful save, the UI shows "Saved — publishing now, live in about a minute." After a failed save, it shows the error and leaves all form state intact so the owner can retry without redoing work.

## 5. Publish flow (`POST /api/admin/save`)

Protected by the same session cookie as the rest of `/admin`.

1. Validate the incoming payload: reject if malformed, if any image exceeds a size ceiling, or if required fields are missing — before any GitHub call is made.
2. Server-side, resize/compress any new or replaced image with `sharp` (reusing the approach already in `scripts/prepare-images.mjs`) so nothing oversized ever lands in the repo.
3. Build one atomic commit against `main` using the GitHub Git Data API (create blobs → create a tree from the current tree + changes → create a commit → update the `main` ref): updated `content/site.json`, new/changed image files under `public/images/`, and deletions for any removed image files. Atomic means a failure partway through never leaves the site half-updated — either the whole commit lands or nothing does.
4. The GitHub token used here (`CMS_GITHUB_TOKEN` — a fine-grained token scoped to only this repo's contents; named to avoid any confusion with GitHub Actions' own reserved `GITHUB_TOKEN`) lives solely in Vercel's server-side environment variables — it is never sent to or readable from the browser.
5. On success, respond immediately (do not wait for the Vercel deploy to finish) with a confirmation message. On failure (GitHub API error, rate limit, token issue), respond with a clear error; the client keeps all unsaved form state so the owner can just retry.

## 6. Testing

- `content/site.ts` (or its loader): a test asserting the JSON conforms to the expected shape (extending the existing `content/site.test.ts` pattern).
- Updated component tests for every component that gains new string props, following the existing test conventions in this repo.
- `/api/admin/login`: tests for correct password, incorrect password, and lockout after repeated failures.
- `/api/admin/save`: tests with a mocked GitHub client verifying (a) the commit is built correctly from a given diff, (b) oversized/malformed input is rejected before any GitHub call, (c) a GitHub API failure surfaces as a clear error without partial writes.
- Before pointing the save flow at the real production repo, it will be exercised against a disposable test repo to verify the commit logic end-to-end, rather than debugging against the live site.

## Risks / open items

- **Publish latency**: every save triggers a real redeploy (~30–60s). Acceptable for a site updated occasionally; would need to move to Approach 2 (database-backed, instant publish) if edit frequency ever increases dramatically. Not expected here.
- **Login brute-force protection is lightweight** (in-memory, resets on cold start). Reasonable for a low-value target; would need a durable rate-limit store (e.g. Vercel KV) if this ever became a concern.
- **Large refactor surface**: because "editable text" scope includes structural labels, most components need at least a small prop-driven change. This is mechanical but touches many files — implementation should proceed component-by-component with tests updated alongside each.
