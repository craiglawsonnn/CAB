# Admin Dashboard — Images, Gallery & Before/After Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add image-upload capability to the admin dashboard, and use it to build the three remaining image-bearing sections: Site Images (logo + hero photo, replace-in-place), Gallery (add/remove photos), and Before/After (add/remove photo pairs). The Pricing section (no images, but deeply nested) is a separate follow-up plan.

**Architecture:** A new `ImageField` primitive shows the current image and lets the user pick a replacement file, which it hands to its parent as a raw `File` — it never uploads anything itself. `AdminDashboard` collects these picked files in a `pendingImages` map (keyed by the image's site-relative path, e.g. `/images/logo.jpg`) plus a `pendingDeletes` set (for images removed from a list). `SaveBar` is extended to base64-encode every pending file and translate both maps into the `images` array `/api/admin/save` already expects, only at the moment of clicking Save & Publish — nothing is uploaded before then. New gallery photos and before/after pairs get a deterministic path assigned the instant they're added (e.g. `/images/gallery-<timestamp>.jpg`), so the content object is always internally consistent even before the user has actually picked a file for a brand-new slot.

**Tech Stack:** React 18 client components, `FileReader` (browser API, also available under Vitest's jsdom environment) for base64 conversion. No new npm dependencies.

**Spec:** `docs/superpowers/specs/2026-09-03-admin-cms-design.md` (section 4 — admin UI). This plan covers the image-bearing subset; the Pricing section is a further follow-up plan.

## Global Constraints

- `ImageField` is a content-agnostic primitive like `TextField`/`TextAreaField`/`ListEditor` — it knows nothing about which site field it's editing, only `label`, `currentSrc`, and an `onFileSelected(file)` callback.
- No image is uploaded to the server until "Save & Publish" is clicked — picking a file only stages it locally.
- New list items (gallery photos, before/after pairs) get their eventual site-relative image path(s) assigned immediately on creation (deterministic from a generated id), so `content` is always a coherent `SiteConfig` even mid-edit.
- Removing a list item whose image was never actually uploaded (still only a local pending file) must not queue a server-side delete for a path that was never published.
- `SaveBar`'s new `pendingImages`/`pendingDeletes` props are optional and default to empty — existing callers (and existing tests, from the prior plan) that don't pass them keep sending `images: []` exactly as before.
- Follow TDD for every step: failing test first, watch it fail, minimal code, watch it pass, commit.

---

## File structure

New:
- `components/admin/fileToBase64.ts` + test — converts a `File` to a base64 string.
- `components/admin/ImageField.tsx` + `.module.css` + test — reusable image-replace primitive.
- `app/admin/sections/SiteImagesSection.tsx` + test — logo + hero photo, replace-in-place.
- `app/admin/sections/GallerySection.tsx` + test — gallery heading/subtitle + photo list.
- `app/admin/sections/BeforeAfterSection.tsx` + test — before/after heading/subtitle/labels + pair list.

Modified:
- `components/admin/SaveBar.tsx` + test — resolves pending images/deletes into the `images` array before posting.
- `app/admin/AdminDashboard.tsx` + test — wires the three new sections in, tracks `pendingImages`/`pendingDeletes`, passes them to `SaveBar`.

---

### Task 1: `fileToBase64` helper

**Files:**
- Create: `components/admin/fileToBase64.ts`, `components/admin/fileToBase64.test.ts`

**Interfaces:**
- Produces: `fileToBase64(file: File): Promise<string>` — consumed by `SaveBar` (Task 3).

- [ ] **Step 1: Write the failing test**

```typescript
// components/admin/fileToBase64.test.ts
import { describe, it, expect } from 'vitest';
import { fileToBase64 } from './fileToBase64';

describe('fileToBase64', () => {
  it('resolves to the base64 encoding of the file contents', async () => {
    const content = 'hello world';
    const file = new File([content], 'test.txt', { type: 'text/plain' });
    const result = await fileToBase64(file);
    expect(result).toBe(Buffer.from(content).toString('base64'));
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/admin/fileToBase64.test.ts`
Expected: FAIL — `fileToBase64` doesn't exist yet.

- [ ] **Step 3: Write `components/admin/fileToBase64.ts`**

```typescript
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] ?? '';
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/admin/fileToBase64.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/admin/fileToBase64.ts components/admin/fileToBase64.test.ts
git commit -m "feat: add fileToBase64 helper for admin image uploads"
```

---

### Task 2: `ImageField` primitive

**Files:**
- Create: `components/admin/ImageField.tsx`, `components/admin/ImageField.module.css`, `components/admin/ImageField.test.tsx`

**Interfaces:**
- Produces: `ImageField({ label: string; currentSrc: string; onFileSelected: (file: File) => void })` — consumed by `SiteImagesSection` (Task 4), `GallerySection` (Task 5), `BeforeAfterSection` (Task 6).

- [ ] **Step 1: Write the failing tests**

```typescript
// components/admin/ImageField.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageField from './ImageField';

describe('ImageField', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview');
  });

  it('renders the current image', () => {
    render(<ImageField label="Logo" currentSrc="/images/logo.jpg" onFileSelected={vi.fn()} />);
    expect(screen.getByAltText('Logo')).toHaveAttribute('src', '/images/logo.jpg');
  });

  it('calls onFileSelected and updates the preview when a file is chosen', async () => {
    const onFileSelected = vi.fn();
    const user = userEvent.setup();
    render(<ImageField label="Logo" currentSrc="/images/logo.jpg" onFileSelected={onFileSelected} />);

    const file = new File(['fake-image-data'], 'new-logo.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Replace') as HTMLInputElement;
    await user.upload(input, file);

    expect(onFileSelected).toHaveBeenCalledWith(file);
    expect(screen.getByAltText('Logo')).toHaveAttribute('src', 'blob:mock-preview');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run components/admin/ImageField.test.tsx`
Expected: FAIL — `ImageField` doesn't exist yet.

- [ ] **Step 3: Write `components/admin/ImageField.tsx`**

```typescript
'use client';

import type { ChangeEvent } from 'react';
import { useState } from 'react';
import styles from './ImageField.module.css';

export interface ImageFieldProps {
  label: string;
  currentSrc: string;
  onFileSelected: (file: File) => void;
}

export default function ImageField({ label, currentSrc, onFileSelected }: ImageFieldProps) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreviewSrc(URL.createObjectURL(file));
    onFileSelected(file);
  };

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={previewSrc ?? currentSrc} alt={label} className={styles.preview} />
      <label className={styles.uploadButton}>
        Replace
        <input type="file" accept="image/*" onChange={handleChange} className={styles.hiddenInput} />
      </label>
    </div>
  );
}
```

```css
/* components/admin/ImageField.module.css */
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.label {
  font-weight: 600;
  font-size: 0.9em;
}

.preview {
  width: 160px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--color-chrome-mid, #ccc);
}

.uploadButton {
  display: inline-block;
  width: fit-content;
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid var(--color-chrome-mid, #ccc);
  cursor: pointer;
  font-size: 0.9em;
}

.hiddenInput {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run components/admin/ImageField.test.tsx`
Expected: all PASS.

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/admin/ImageField.tsx components/admin/ImageField.module.css components/admin/ImageField.test.tsx
git commit -m "feat: add ImageField admin form primitive"
```

---

### Task 3: `SaveBar` resolves pending images and deletes

**Files:**
- Modify: `components/admin/SaveBar.tsx`, `components/admin/SaveBar.test.tsx`

**Interfaces:**
- Consumes: `fileToBase64` (Task 1).
- Produces: `SaveBar` gains two new optional props, `pendingImages?: Record<string, File>` (default `{}`) and `pendingDeletes?: string[]` (default `[]`) — consumed by `AdminDashboard` (Task 7). Existing callers that omit both props are unaffected (still post `images: []`).

- [ ] **Step 1: Write the failing test**

Add this test to the existing `components/admin/SaveBar.test.tsx` (keep the three existing tests from the prior plan unchanged):

```typescript
it('resolves pending image uploads and deletes into the images array before posting', async () => {
  const fetchMock = vi
    .spyOn(global, 'fetch')
    .mockResolvedValue(new Response(JSON.stringify({ ok: true, commitSha: 'abc' }), { status: 200 }));
  const file = new File(['fake-bytes'], 'new.jpg', { type: 'image/jpeg' });
  const user = userEvent.setup();
  render(
    <SaveBar
      content={siteConfig}
      pendingImages={{ '/images/new.jpg': file }}
      pendingDeletes={['/images/old.jpg']}
    />
  );

  await user.click(screen.getByRole('button', { name: 'Save & Publish' }));

  expect(await screen.findByRole('status')).toHaveTextContent('Saved');
  const [, requestInit] = fetchMock.mock.calls[0];
  const body = JSON.parse((requestInit as RequestInit).body as string);
  expect(body.images).toEqual([
    { path: 'public/images/new.jpg', action: 'upsert', base64: Buffer.from('fake-bytes').toString('base64') },
    { path: 'public/images/old.jpg', action: 'delete' },
  ]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/admin/SaveBar.test.tsx`
Expected: FAIL — `SaveBar` doesn't yet accept `pendingImages`/`pendingDeletes`, and even if TypeScript allowed the extra props structurally, the posted `images` array would still be `[]`.

- [ ] **Step 3: Update `components/admin/SaveBar.tsx`**

```typescript
'use client';

import { useState } from 'react';
import type { SiteConfig } from '@/content/site';
import { fileToBase64 } from './fileToBase64';
import styles from './SaveBar.module.css';

export interface SaveBarProps {
  content: SiteConfig;
  pendingImages?: Record<string, File>;
  pendingDeletes?: string[];
  onSaved?: () => void;
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

function toPublicPath(src: string): string {
  return `public${src}`;
}

export default function SaveBar({
  content,
  pendingImages = {},
  pendingDeletes = [],
  onSaved,
}: SaveBarProps) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setStatus('saving');
    setError(null);
    try {
      const upserts = await Promise.all(
        Object.entries(pendingImages).map(async ([path, file]) => ({
          path: toPublicPath(path),
          action: 'upsert' as const,
          base64: await fileToBase64(file),
        }))
      );
      const deletes = pendingDeletes.map((path) => ({
        path: toPublicPath(path),
        action: 'delete' as const,
      }));

      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, images: [...upserts, ...deletes] }),
      });
      const data = await response.json();
      if (data.ok) {
        setStatus('success');
        onSaved?.();
        return;
      }
      setStatus('error');
      setError(data.error ?? 'Save failed.');
    } catch {
      setStatus('error');
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className={styles.bar}>
      <button type="button" onClick={handleSave} disabled={status === 'saving'}>
        {status === 'saving' ? 'Publishing…' : 'Save & Publish'}
      </button>
      {status === 'success' && (
        <span className={styles.success} role="status">
          Saved — publishing now, live in about a minute.
        </span>
      )}
      {status === 'error' && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run components/admin/SaveBar.test.tsx`
Expected: all PASS (the three pre-existing tests plus the new one — confirms the optional-props default keeps old behavior intact).

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/admin/SaveBar.tsx components/admin/SaveBar.test.tsx
git commit -m "feat: SaveBar resolves pending image uploads and deletes before publishing"
```

---

### Task 4: `SiteImagesSection`

**Files:**
- Create: `app/admin/sections/SiteImagesSection.tsx`, `app/admin/sections/SiteImagesSection.test.tsx`

**Interfaces:**
- Consumes: `ImageField` (Task 2), the shared `app/admin/sections/Section.module.css` (from the prior plan).
- Produces: `SiteImagesSection({ logoSrc: string; heroImageSrc: string; onImageSelected: (path: string, file: File) => void })` — consumed by `AdminDashboard` (Task 7). Unlike the other new sections, this one has no `onChange` — the site's logo and hero image are always replaced in place at their existing path, so no `SiteConfig` field ever changes value.

- [ ] **Step 1: Write the failing test**

```typescript
// app/admin/sections/SiteImagesSection.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SiteImagesSection from './SiteImagesSection';

describe('SiteImagesSection', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview');
  });

  it('renders the current logo and hero images', () => {
    render(
      <SiteImagesSection logoSrc="/images/logo.jpg" heroImageSrc="/images/hero.jpg" onImageSelected={vi.fn()} />
    );
    expect(screen.getByAltText('Logo')).toHaveAttribute('src', '/images/logo.jpg');
    expect(screen.getByAltText('Hero Photo')).toHaveAttribute('src', '/images/hero.jpg');
  });

  it('calls onImageSelected with the existing logo path when a new logo file is chosen', async () => {
    const onImageSelected = vi.fn();
    const user = userEvent.setup();
    render(
      <SiteImagesSection
        logoSrc="/images/logo.jpg"
        heroImageSrc="/images/hero.jpg"
        onImageSelected={onImageSelected}
      />
    );
    const file = new File(['data'], 'new-logo.jpg', { type: 'image/jpeg' });
    const inputs = screen.getAllByLabelText('Replace');
    await user.upload(inputs[0], file);
    expect(onImageSelected).toHaveBeenCalledWith('/images/logo.jpg', file);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run app/admin/sections/SiteImagesSection.test.tsx`
Expected: FAIL — `SiteImagesSection` doesn't exist yet.

- [ ] **Step 3: Write `app/admin/sections/SiteImagesSection.tsx`**

```typescript
'use client';

import ImageField from '@/components/admin/ImageField';
import styles from './Section.module.css';

export interface SiteImagesSectionProps {
  logoSrc: string;
  heroImageSrc: string;
  onImageSelected: (path: string, file: File) => void;
}

export default function SiteImagesSection({
  logoSrc,
  heroImageSrc,
  onImageSelected,
}: SiteImagesSectionProps) {
  return (
    <section className={styles.section}>
      <h2>Site Images</h2>
      <ImageField label="Logo" currentSrc={logoSrc} onFileSelected={(file) => onImageSelected(logoSrc, file)} />
      <ImageField
        label="Hero Photo"
        currentSrc={heroImageSrc}
        onFileSelected={(file) => onImageSelected(heroImageSrc, file)}
      />
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run app/admin/sections/SiteImagesSection.test.tsx`
Expected: all PASS.

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/admin/sections/SiteImagesSection.tsx app/admin/sections/SiteImagesSection.test.tsx
git commit -m "feat: add admin SiteImagesSection (logo + hero photo replace-in-place)"
```

---

### Task 5: `GallerySection` (admin)

**Files:**
- Create: `app/admin/sections/GallerySection.tsx`, `app/admin/sections/GallerySection.test.tsx`

**Interfaces:**
- Consumes: `TextField` (from the prior plan), `ImageField` (Task 2), `ListEditor` (from the prior plan), `GalleryConfig`/`GalleryImage` types from `@/content/site`.
- Produces: `GallerySection({ content: GalleryConfig; onChange: (gallery: GalleryConfig) => void; onImageSelected: (path: string, file: File) => void; onImageRemoved: (path: string) => void })` — consumed by `AdminDashboard` (Task 7).

- [ ] **Step 1: Write the failing test**

```typescript
// app/admin/sections/GallerySection.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GallerySection from './GallerySection';
import type { GalleryConfig } from '@/content/site';

const content: GalleryConfig = {
  heading: 'Gallery',
  subtitle: 'More of our recent work',
  images: [{ id: 'a', src: '/images/a.jpg', alt: 'Photo A', caption: 'Caption A' }],
};

describe('GallerySection', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview');
  });

  it('renders current values', () => {
    render(
      <GallerySection content={content} onChange={vi.fn()} onImageSelected={vi.fn()} onImageRemoved={vi.fn()} />
    );
    expect(screen.getByLabelText('Heading')).toHaveValue(content.heading);
    expect(screen.getByLabelText('Alt Text')).toHaveValue('Photo A');
    expect(screen.getByAltText('Photo')).toHaveAttribute('src', '/images/a.jpg');
  });

  it('calls onImageSelected with the image path when a new photo is chosen', async () => {
    const onImageSelected = vi.fn();
    const user = userEvent.setup();
    render(
      <GallerySection
        content={content}
        onChange={vi.fn()}
        onImageSelected={onImageSelected}
        onImageRemoved={vi.fn()}
      />
    );
    const file = new File(['data'], 'new.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText('Replace'), file);
    expect(onImageSelected).toHaveBeenCalledWith('/images/a.jpg', file);
  });

  it('calls onImageRemoved with the removed image path when Remove is clicked', async () => {
    const onChange = vi.fn();
    const onImageRemoved = vi.fn();
    const user = userEvent.setup();
    render(
      <GallerySection
        content={content}
        onChange={onChange}
        onImageSelected={vi.fn()}
        onImageRemoved={onImageRemoved}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onImageRemoved).toHaveBeenCalledWith('/images/a.jpg');
    expect(onChange).toHaveBeenCalledWith({ ...content, images: [] });
  });

  it('adds a new photo with a generated id and src when Add Photo is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <GallerySection content={content} onChange={onChange} onImageSelected={vi.fn()} onImageRemoved={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: 'Add Photo' }));
    const [updated] = onChange.mock.calls[0];
    expect(updated.images).toHaveLength(2);
    expect(updated.images[1]).toMatchObject({ alt: '', caption: '' });
    expect(updated.images[1].src).toMatch(/^\/images\/gallery-\d+\.jpg$/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run app/admin/sections/GallerySection.test.tsx`
Expected: FAIL — `GallerySection` doesn't exist yet.

- [ ] **Step 3: Write `app/admin/sections/GallerySection.tsx`**

```typescript
'use client';

import type { GalleryConfig, GalleryImage } from '@/content/site';
import TextField from '@/components/admin/TextField';
import ImageField from '@/components/admin/ImageField';
import ListEditor from '@/components/admin/ListEditor';
import styles from './Section.module.css';

export interface GallerySectionProps {
  content: GalleryConfig;
  onChange: (gallery: GalleryConfig) => void;
  onImageSelected: (path: string, file: File) => void;
  onImageRemoved: (path: string) => void;
}

export default function GallerySection({
  content,
  onChange,
  onImageSelected,
  onImageRemoved,
}: GallerySectionProps) {
  const update = (patch: Partial<GalleryConfig>) => onChange({ ...content, ...patch });

  const handleImagesChange = (images: GalleryImage[]) => {
    const removed = content.images.filter((image) => !images.some((next) => next.id === image.id));
    removed.forEach((image) => onImageRemoved(image.src));
    update({ images });
  };

  return (
    <section className={styles.section}>
      <h2>Gallery</h2>
      <TextField label="Heading" value={content.heading} onChange={(heading) => update({ heading })} />
      <TextField label="Subtitle" value={content.subtitle} onChange={(subtitle) => update({ subtitle })} />
      <ListEditor<GalleryImage>
        items={content.images}
        onChange={handleImagesChange}
        getKey={(image) => image.id}
        createItem={() => {
          const id = `gallery-${Date.now()}`;
          return { id, src: `/images/${id}.jpg`, alt: '', caption: '' };
        }}
        addLabel="Add Photo"
        renderItem={(image, onUpdate) => (
          <>
            <ImageField
              label="Photo"
              currentSrc={image.src}
              onFileSelected={(file) => onImageSelected(image.src, file)}
            />
            <TextField label="Alt Text" value={image.alt} onChange={(alt) => onUpdate({ alt })} />
            <TextField label="Caption" value={image.caption} onChange={(caption) => onUpdate({ caption })} />
          </>
        )}
      />
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run app/admin/sections/GallerySection.test.tsx`
Expected: all PASS.

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/admin/sections/GallerySection.tsx app/admin/sections/GallerySection.test.tsx
git commit -m "feat: add admin GallerySection (add/remove photos)"
```

---

### Task 6: `BeforeAfterSection` (admin)

**Files:**
- Create: `app/admin/sections/BeforeAfterSection.tsx`, `app/admin/sections/BeforeAfterSection.test.tsx`

**Interfaces:**
- Consumes: `TextField` (prior plan), `ImageField` (Task 2), `ListEditor` (prior plan), `BeforeAfterConfig`/`BeforeAfterPair` types from `@/content/site`.
- Produces: `BeforeAfterSection({ content: BeforeAfterConfig; onChange: (beforeAfter: BeforeAfterConfig) => void; onImageSelected: (path: string, file: File) => void; onImageRemoved: (path: string) => void })` — consumed by `AdminDashboard` (Task 7).

- [ ] **Step 1: Write the failing test**

```typescript
// app/admin/sections/BeforeAfterSection.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BeforeAfterSection from './BeforeAfterSection';
import type { BeforeAfterConfig } from '@/content/site';

const content: BeforeAfterConfig = {
  heading: 'Our Work: Before & After',
  subtitle: 'Drag the divider to see the transformation',
  viewMoreTemplate: 'View {count} More',
  showFewerLabel: 'Show Fewer',
  beforeTagLabel: 'Before',
  afterTagLabel: 'After',
  ariaLabelPrefix: 'Before and after comparison: ',
  pairs: [
    {
      id: 'p1',
      beforeSrc: '/images/p1-before.jpg',
      afterSrc: '/images/p1-after.jpg',
      beforeAlt: 'Before shot',
      afterAlt: 'After shot',
      caption: 'Driver Door',
    },
  ],
};

describe('BeforeAfterSection', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview');
  });

  it('renders current values', () => {
    render(
      <BeforeAfterSection content={content} onChange={vi.fn()} onImageSelected={vi.fn()} onImageRemoved={vi.fn()} />
    );
    expect(screen.getByLabelText('Heading')).toHaveValue(content.heading);
    expect(screen.getByLabelText('Caption')).toHaveValue('Driver Door');
    expect(screen.getByAltText('Before Photo')).toHaveAttribute('src', '/images/p1-before.jpg');
    expect(screen.getByAltText('After Photo')).toHaveAttribute('src', '/images/p1-after.jpg');
  });

  it('calls onImageSelected with the correct path for the before and after images', async () => {
    const onImageSelected = vi.fn();
    const user = userEvent.setup();
    render(
      <BeforeAfterSection
        content={content}
        onChange={vi.fn()}
        onImageSelected={onImageSelected}
        onImageRemoved={vi.fn()}
      />
    );
    const file = new File(['data'], 'new.jpg', { type: 'image/jpeg' });
    const inputs = screen.getAllByLabelText('Replace');
    await user.upload(inputs[0], file);
    expect(onImageSelected).toHaveBeenCalledWith('/images/p1-before.jpg', file);
    await user.upload(inputs[1], file);
    expect(onImageSelected).toHaveBeenCalledWith('/images/p1-after.jpg', file);
  });

  it('calls onImageRemoved for both images when a pair is removed', async () => {
    const onImageRemoved = vi.fn();
    const user = userEvent.setup();
    render(
      <BeforeAfterSection
        content={content}
        onChange={vi.fn()}
        onImageSelected={vi.fn()}
        onImageRemoved={onImageRemoved}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onImageRemoved).toHaveBeenCalledWith('/images/p1-before.jpg');
    expect(onImageRemoved).toHaveBeenCalledWith('/images/p1-after.jpg');
  });

  it('adds a new pair with generated ids and image paths when Add Pair is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <BeforeAfterSection content={content} onChange={onChange} onImageSelected={vi.fn()} onImageRemoved={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: 'Add Pair' }));
    const [updated] = onChange.mock.calls[0];
    expect(updated.pairs).toHaveLength(2);
    expect(updated.pairs[1].beforeSrc).toMatch(/^\/images\/pair-\d+-before\.jpg$/);
    expect(updated.pairs[1].afterSrc).toMatch(/^\/images\/pair-\d+-after\.jpg$/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run app/admin/sections/BeforeAfterSection.test.tsx`
Expected: FAIL — `BeforeAfterSection` doesn't exist yet.

- [ ] **Step 3: Write `app/admin/sections/BeforeAfterSection.tsx`**

```typescript
'use client';

import type { BeforeAfterConfig, BeforeAfterPair } from '@/content/site';
import TextField from '@/components/admin/TextField';
import ImageField from '@/components/admin/ImageField';
import ListEditor from '@/components/admin/ListEditor';
import styles from './Section.module.css';

export interface BeforeAfterSectionProps {
  content: BeforeAfterConfig;
  onChange: (beforeAfter: BeforeAfterConfig) => void;
  onImageSelected: (path: string, file: File) => void;
  onImageRemoved: (path: string) => void;
}

export default function BeforeAfterSection({
  content,
  onChange,
  onImageSelected,
  onImageRemoved,
}: BeforeAfterSectionProps) {
  const update = (patch: Partial<BeforeAfterConfig>) => onChange({ ...content, ...patch });

  const handlePairsChange = (pairs: BeforeAfterPair[]) => {
    const removed = content.pairs.filter((pair) => !pairs.some((next) => next.id === pair.id));
    removed.forEach((pair) => {
      onImageRemoved(pair.beforeSrc);
      onImageRemoved(pair.afterSrc);
    });
    update({ pairs });
  };

  return (
    <section className={styles.section}>
      <h2>Before &amp; After</h2>
      <TextField label="Heading" value={content.heading} onChange={(heading) => update({ heading })} />
      <TextField label="Subtitle" value={content.subtitle} onChange={(subtitle) => update({ subtitle })} />
      <TextField
        label="View More Template (use {count})"
        value={content.viewMoreTemplate}
        onChange={(viewMoreTemplate) => update({ viewMoreTemplate })}
      />
      <TextField
        label="Show Fewer Label"
        value={content.showFewerLabel}
        onChange={(showFewerLabel) => update({ showFewerLabel })}
      />
      <TextField
        label="Before Tag Label"
        value={content.beforeTagLabel}
        onChange={(beforeTagLabel) => update({ beforeTagLabel })}
      />
      <TextField
        label="After Tag Label"
        value={content.afterTagLabel}
        onChange={(afterTagLabel) => update({ afterTagLabel })}
      />
      <TextField
        label="Slider Aria Label Prefix"
        value={content.ariaLabelPrefix}
        onChange={(ariaLabelPrefix) => update({ ariaLabelPrefix })}
      />
      <ListEditor<BeforeAfterPair>
        items={content.pairs}
        onChange={handlePairsChange}
        getKey={(pair) => pair.id}
        createItem={() => {
          const id = `pair-${Date.now()}`;
          return {
            id,
            beforeSrc: `/images/${id}-before.jpg`,
            afterSrc: `/images/${id}-after.jpg`,
            beforeAlt: '',
            afterAlt: '',
            caption: '',
          };
        }}
        addLabel="Add Pair"
        renderItem={(pair, onUpdate) => (
          <>
            <ImageField
              label="Before Photo"
              currentSrc={pair.beforeSrc}
              onFileSelected={(file) => onImageSelected(pair.beforeSrc, file)}
            />
            <TextField
              label="Before Alt Text"
              value={pair.beforeAlt}
              onChange={(beforeAlt) => onUpdate({ beforeAlt })}
            />
            <ImageField
              label="After Photo"
              currentSrc={pair.afterSrc}
              onFileSelected={(file) => onImageSelected(pair.afterSrc, file)}
            />
            <TextField label="After Alt Text" value={pair.afterAlt} onChange={(afterAlt) => onUpdate({ afterAlt })} />
            <TextField label="Caption" value={pair.caption} onChange={(caption) => onUpdate({ caption })} />
          </>
        )}
      />
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run app/admin/sections/BeforeAfterSection.test.tsx`
Expected: all PASS.

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/admin/sections/BeforeAfterSection.tsx app/admin/sections/BeforeAfterSection.test.tsx
git commit -m "feat: add admin BeforeAfterSection (add/remove photo pairs)"
```

---

### Task 7: Wire the three new sections into `AdminDashboard`, final verification

**Files:**
- Modify: `app/admin/AdminDashboard.tsx`, `app/admin/AdminDashboard.test.tsx`

**Interfaces:**
- Consumes: `SiteImagesSection` (Task 4), `GallerySection` (Task 5), `BeforeAfterSection` (Task 6), the updated `SaveBar` (Task 3).
- Produces: `AdminDashboard` now also tracks `pendingImages: Record<string, File>` and `pendingDeletes: Set<string>` state, exposing `registerImage`/`removeImage` callbacks to the new sections, and clears both on a successful save.

- [ ] **Step 1: Write the failing tests**

Replace `app/admin/AdminDashboard.test.tsx` with:

```typescript
// app/admin/AdminDashboard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { siteConfig } from '@/content/site';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import AdminDashboard from './AdminDashboard';

describe('AdminDashboard', () => {
  it('renders every built section with the current content', () => {
    render(<AdminDashboard initialContent={siteConfig} />);
    expect(screen.getByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Site Basics' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Site Images' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Navigation' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hero' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Before & After' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gallery' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Video Showcase' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reviews' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Contact' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Footer' })).toBeInTheDocument();
    expect(screen.getByLabelText('Business Name')).toHaveValue(siteConfig.businessName);
    expect(screen.getByRole('button', { name: 'Save & Publish' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });

  it('sends the full content object, with an edited field, when Save & Publish is clicked', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ ok: true, commitSha: 'abc' }), { status: 200 }));
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<AdminDashboard initialContent={siteConfig} />);

    await user.type(screen.getByLabelText('Business Name'), 'X');
    await user.click(screen.getByRole('button', { name: 'Save & Publish' }));

    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse((requestInit as RequestInit).body as string);
    expect(body.content.businessName).toBe(`${siteConfig.businessName}X`);
    expect(body.content.pricing).toEqual(siteConfig.pricing);
    expect(body.images).toEqual([]);
  });

  it('registers a pending image upload when a photo is replaced in Site Images', async () => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview');
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ ok: true, commitSha: 'abc' }), { status: 200 }));
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<AdminDashboard initialContent={siteConfig} />);

    const file = new File(['new-logo-bytes'], 'logo.jpg', { type: 'image/jpeg' });
    const [logoInput] = screen.getAllByLabelText('Replace');
    await user.upload(logoInput, file);
    await user.click(screen.getByRole('button', { name: 'Save & Publish' }));

    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse((requestInit as RequestInit).body as string);
    expect(body.images).toEqual([
      {
        path: `public${siteConfig.logoSrc}`,
        action: 'upsert',
        base64: Buffer.from('new-logo-bytes').toString('base64'),
      },
    ]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run app/admin/AdminDashboard.test.tsx`
Expected: FAIL — `AdminDashboard` doesn't render the new sections yet, and doesn't accept/resolve pending images.

- [ ] **Step 3: Update `app/admin/AdminDashboard.tsx`**

```typescript
'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SiteConfig } from '@/content/site';
import SaveBar from '@/components/admin/SaveBar';
import BasicsSection, { type BasicsFields } from './sections/BasicsSection';
import SiteImagesSection from './sections/SiteImagesSection';
import NavSection from './sections/NavSection';
import HeroSection from './sections/HeroSection';
import BeforeAfterSection from './sections/BeforeAfterSection';
import GallerySection from './sections/GallerySection';
import ReelsSection from './sections/ReelsSection';
import ReviewsSection from './sections/ReviewsSection';
import ContactSection from './sections/ContactSection';
import FooterSection from './sections/FooterSection';
import LogoutButton from './LogoutButton';
import styles from './AdminDashboard.module.css';

export interface AdminDashboardProps {
  initialContent: SiteConfig;
}

export default function AdminDashboard({ initialContent }: AdminDashboardProps) {
  const [content, setContent] = useState<SiteConfig>(initialContent);
  const [dirty, setDirty] = useState(false);
  const [pendingImages, setPendingImages] = useState<Record<string, File>>({});
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());

  const updateContent = useCallback((patch: Partial<SiteConfig>) => {
    setContent((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }, []);

  const registerImage = useCallback((path: string, file: File) => {
    setPendingImages((prev) => ({ ...prev, [path]: file }));
    setPendingDeletes((prev) => {
      if (!prev.has(path)) return prev;
      const next = new Set(prev);
      next.delete(path);
      return next;
    });
    setDirty(true);
  }, []);

  const removeImage = useCallback(
    (path: string) => {
      setPendingImages((prev) => {
        const next = { ...prev };
        delete next[path];
        return next;
      });
      if (!(path in pendingImages)) {
        setPendingDeletes((prev) => new Set(prev).add(path));
      }
      setDirty(true);
    },
    [pendingImages]
  );

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  const basicsFields: BasicsFields = {
    businessName: content.businessName,
    phoneDisplay: content.phoneDisplay,
    phoneHref: content.phoneHref,
    instagramDmUrl: content.instagramDmUrl,
    instagramPendingLabel: content.instagramPendingLabel,
    seoTitle: content.seo.title,
    seoDescription: content.seo.description,
  };

  const handleBasicsChange = (fields: BasicsFields) => {
    updateContent({
      businessName: fields.businessName,
      phoneDisplay: fields.phoneDisplay,
      phoneHref: fields.phoneHref,
      instagramDmUrl: fields.instagramDmUrl,
      instagramPendingLabel: fields.instagramPendingLabel,
      seo: { title: fields.seoTitle, description: fields.seoDescription },
    });
  };

  const handleSaved = () => {
    setDirty(false);
    setPendingImages({});
    setPendingDeletes(new Set());
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1>Admin Dashboard</h1>
        <LogoutButton />
      </div>
      <SaveBar
        content={content}
        pendingImages={pendingImages}
        pendingDeletes={Array.from(pendingDeletes)}
        onSaved={handleSaved}
      />
      <BasicsSection fields={basicsFields} onChange={handleBasicsChange} />
      <SiteImagesSection
        logoSrc={content.logoSrc}
        heroImageSrc={content.heroImageSrc}
        onImageSelected={registerImage}
      />
      <NavSection content={content.nav} onChange={(nav) => updateContent({ nav })} />
      <HeroSection content={content.hero} onChange={(hero) => updateContent({ hero })} />
      <BeforeAfterSection
        content={content.beforeAfter}
        onChange={(beforeAfter) => updateContent({ beforeAfter })}
        onImageSelected={registerImage}
        onImageRemoved={removeImage}
      />
      <GallerySection
        content={content.gallery}
        onChange={(gallery) => updateContent({ gallery })}
        onImageSelected={registerImage}
        onImageRemoved={removeImage}
      />
      <ReelsSection content={content.reels} onChange={(reels) => updateContent({ reels })} />
      <ReviewsSection
        content={content.googleReview}
        onChange={(googleReview) => updateContent({ googleReview })}
      />
      <ContactSection content={content.contact} onChange={(contact) => updateContent({ contact })} />
      <FooterSection content={content.footer} onChange={(footer) => updateContent({ footer })} />
    </main>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run app/admin/AdminDashboard.test.tsx`
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
git add app/admin/AdminDashboard.tsx app/admin/AdminDashboard.test.tsx
git commit -m "feat: wire Site Images, Gallery, and Before/After into the admin dashboard"
```

## Self-review notes

- **Spec coverage:** Implements the image-bearing subset of spec section 4 — Site Images, Gallery, and Before/After, including the purely-textual fields inside those sections (heading/subtitle/labels) that the prior plan's final review flagged as needing to be carried into this follow-up. Pricing (no images, but deep nesting) is the next plan.
- **Placeholder scan:** No TBDs; every step has complete, real code.
- **Type consistency:** `ImageField`'s prop signature is defined once (Task 2) and reused verbatim by every consuming section; `SaveBar`'s new optional props are backward-compatible with the prior plan's existing call sites and tests (verified by keeping those three tests unchanged in Task 3).
- **Scope check:** Single subsystem (image upload infrastructure + three image-bearing sections), ready to execute as one plan. Pricing is the next plan.
