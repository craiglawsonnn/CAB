# Admin Dashboard — Basics & Text Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stub `/admin` dashboard page with a real content editor for every purely-textual part of the site (business basics, SEO, nav, hero copy, reels, reviews, contact, footer), wired to actually publish changes via the existing `/api/admin/save` endpoint. Image fields and the more structurally complex sections (gallery, before/after pairs, pricing) are explicitly out of scope — a follow-up plan adds those on top of this one's foundation.

**Architecture:** A single client-side dashboard (`app/admin/AdminDashboard.tsx`) holds the entire site content as one piece of React state, initialized from the server-rendered `siteConfig`. Each content section is a small controlled component (`content` in, `onChange` out) built from a handful of reusable, content-agnostic primitives: `TextField`, `TextAreaField`, and a generic `ListEditor` (add/remove/move-up/move-down, no drag-and-drop, per the approved design spec). A sticky `SaveBar` sends the whole current state to `/api/admin/save` on click. Because the state is always a full copy of `SiteConfig`, sections this plan doesn't build (images, gallery, before/after, pricing) simply pass through unchanged — publishing from this plan alone is already safe and complete, just not yet able to edit everything.

**Tech Stack:** React 18 client components, existing Vitest + Testing Library stack. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-03-admin-cms-design.md` (section 4 — admin UI). This plan covers the flat/textual subset of section 4; a follow-up plan covers images, gallery, before/after, and pricing.

## Global Constraints

- `TextField`, `TextAreaField`, and `ListEditor` are content-agnostic primitives — no section-specific logic belongs in them.
- Every section component is a pure controlled component: it receives its slice of content plus an `onChange`, and never fetches or persists anything itself. All state lives in `AdminDashboard`.
- The content object sent to `/api/admin/save` is always the **full** `SiteConfig`, not just the edited fields — sections this plan doesn't build must pass through unchanged, never be dropped.
- This plan sends `images: []` on every save — no image upload capability exists yet (that's the follow-up plan).
- Out of scope for this plan: `logoSrc`, `heroImageSrc` (image fields), `gallery`, `beforeAfter`, `pricing` (deferred — images and/or deep nesting).
- Follow TDD for every step: failing test first, watch it fail, minimal code, watch it pass, commit.

---

## File structure

New:
- `components/admin/TextField.tsx` + `.module.css` + test — reusable single-line text input.
- `components/admin/TextAreaField.tsx` + `.module.css` + test — reusable multi-line text input.
- `components/admin/ListEditor.tsx` + `.module.css` + test — generic add/remove/move-up/move-down list wrapper.
- `components/admin/SaveBar.tsx` + `.module.css` + test — sticky Save & Publish button, calls `/api/admin/save`.
- `app/admin/sections/Section.module.css` — shared section-card styling, reused by every section component below.
- `app/admin/sections/BasicsSection.tsx` + test — business info + SEO.
- `app/admin/sections/NavSection.tsx` + test — nav links list + button labels.
- `app/admin/sections/HeroSection.tsx` + test — hero copy (no image).
- `app/admin/sections/ReelsSection.tsx` + test — reels heading/subtitle/pending-label + reel items list.
- `app/admin/sections/ReviewsSection.tsx` + test — Google review copy and numbers.
- `app/admin/sections/ContactSection.tsx` + test — contact section copy.
- `app/admin/sections/FooterSection.tsx` + test — footer copy.
- `app/admin/AdminDashboard.tsx` + `.module.css` + test — composes everything above, owns the content state, unsaved-changes warning.

Modified:
- `app/admin/page.tsx` — replaces the stub content with `<AdminDashboard initialContent={siteConfig} />`.
- `app/admin/page.test.tsx` — updated for the real dashboard's rendered output.

---

### Task 1: `TextField` and `TextAreaField` primitives

**Files:**
- Create: `components/admin/TextField.tsx`, `components/admin/TextField.module.css`, `components/admin/TextField.test.tsx`
- Create: `components/admin/TextAreaField.tsx`, `components/admin/TextAreaField.module.css`, `components/admin/TextAreaField.test.tsx`

**Interfaces:**
- Produces: `TextField({ label: string; value: string; onChange: (value: string) => void })`, `TextAreaField({ label: string; value: string; onChange: (value: string) => void; rows?: number })` — consumed by every section component in Tasks 4-9.

- [ ] **Step 1: Write the failing tests**

```typescript
// components/admin/TextField.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextField from './TextField';

describe('TextField', () => {
  it('renders the label and current value', () => {
    render(<TextField label="Business Name" value="CAB Premium Detailing" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Business Name')).toHaveValue('CAB Premium Detailing');
  });

  it('calls onChange with the new value as the user types', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TextField label="Business Name" value="" onChange={onChange} />);
    await user.type(screen.getByLabelText('Business Name'), 'X');
    expect(onChange).toHaveBeenCalledWith('X');
  });
});
```

```typescript
// components/admin/TextAreaField.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextAreaField from './TextAreaField';

describe('TextAreaField', () => {
  it('renders the label and current value', () => {
    render(<TextAreaField label="Subtitle" value="Mobile service." onChange={vi.fn()} />);
    expect(screen.getByLabelText('Subtitle')).toHaveValue('Mobile service.');
  });

  it('calls onChange with the new value as the user types', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TextAreaField label="Subtitle" value="" onChange={onChange} />);
    await user.type(screen.getByLabelText('Subtitle'), 'X');
    expect(onChange).toHaveBeenCalledWith('X');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run components/admin/TextField.test.tsx components/admin/TextAreaField.test.tsx`
Expected: FAIL — neither component exists yet.

- [ ] **Step 3: Write `components/admin/TextField.tsx`**

```typescript
'use client';

import styles from './TextField.module.css';

export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export default function TextField({ label, value, onChange }: TextFieldProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={styles.input}
      />
    </label>
  );
}
```

```css
/* components/admin/TextField.module.css */
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.label {
  font-weight: 600;
  font-size: 0.9em;
}

.input {
  padding: 8px 10px;
  border: 1px solid var(--color-chrome-mid, #ccc);
  border-radius: 6px;
  font-size: 1rem;
}
```

- [ ] **Step 4: Write `components/admin/TextAreaField.tsx`**

```typescript
'use client';

import styles from './TextAreaField.module.css';

export interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}

export default function TextAreaField({ label, value, onChange, rows = 3 }: TextAreaFieldProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className={styles.textarea}
      />
    </label>
  );
}
```

```css
/* components/admin/TextAreaField.module.css */
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.label {
  font-weight: 600;
  font-size: 0.9em;
}

.textarea {
  padding: 8px 10px;
  border: 1px solid var(--color-chrome-mid, #ccc);
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run components/admin/TextField.test.tsx components/admin/TextAreaField.test.tsx`
Expected: all PASS.

- [ ] **Step 6: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/admin/TextField.tsx components/admin/TextField.module.css components/admin/TextField.test.tsx components/admin/TextAreaField.tsx components/admin/TextAreaField.module.css components/admin/TextAreaField.test.tsx
git commit -m "feat: add TextField and TextAreaField admin form primitives"
```

---

### Task 2: `ListEditor` generic list primitive

**Files:**
- Create: `components/admin/ListEditor.tsx`, `components/admin/ListEditor.module.css`, `components/admin/ListEditor.test.tsx`

**Interfaces:**
- Consumes: `TextField` (Task 1, used only in this task's test fixture).
- Produces: `ListEditor<T>({ items: T[]; onChange: (items: T[]) => void; getKey: (item: T, index: number) => string; createItem: () => T; addLabel: string; renderItem: (item: T, onUpdate: (patch: Partial<T>) => void) => React.ReactNode })` — consumed by `NavSection` (Task 5) and `ReelsSection` (Task 7).

- [ ] **Step 1: Write the failing tests**

```typescript
// components/admin/ListEditor.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ListEditor from './ListEditor';
import TextField from './TextField';

interface Item {
  id: string;
  text: string;
}

function renderList(items: Item[], onChange: (items: Item[]) => void) {
  return render(
    <ListEditor<Item>
      items={items}
      onChange={onChange}
      getKey={(item) => item.id}
      createItem={() => ({ id: 'new', text: '' })}
      addLabel="Add Item"
      renderItem={(item, onUpdate) => (
        <TextField label={`Item ${item.id}`} value={item.text} onChange={(text) => onUpdate({ text })} />
      )}
    />
  );
}

describe('ListEditor', () => {
  it('renders one field per item', () => {
    renderList(
      [
        { id: 'a', text: 'First' },
        { id: 'b', text: 'Second' },
      ],
      vi.fn()
    );
    expect(screen.getByLabelText('Item a')).toHaveValue('First');
    expect(screen.getByLabelText('Item b')).toHaveValue('Second');
  });

  it('calls onChange with an appended item when Add is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderList([{ id: 'a', text: 'First' }], onChange);
    await user.click(screen.getByRole('button', { name: 'Add Item' }));
    expect(onChange).toHaveBeenCalledWith([
      { id: 'a', text: 'First' },
      { id: 'new', text: '' },
    ]);
  });

  it('calls onChange with the item removed when Remove is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderList(
      [
        { id: 'a', text: 'First' },
        { id: 'b', text: 'Second' },
      ],
      onChange
    );
    await user.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
    expect(onChange).toHaveBeenCalledWith([{ id: 'b', text: 'Second' }]);
  });

  it('swaps two items when Move down is clicked on the first one', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderList(
      [
        { id: 'a', text: 'First' },
        { id: 'b', text: 'Second' },
      ],
      onChange
    );
    await user.click(screen.getAllByRole('button', { name: 'Move down' })[0]);
    expect(onChange).toHaveBeenCalledWith([
      { id: 'b', text: 'Second' },
      { id: 'a', text: 'First' },
    ]);
  });

  it('disables Move up on the first item and Move down on the last item', () => {
    renderList(
      [
        { id: 'a', text: 'First' },
        { id: 'b', text: 'Second' },
      ],
      vi.fn()
    );
    const moveUpButtons = screen.getAllByRole('button', { name: 'Move up' });
    const moveDownButtons = screen.getAllByRole('button', { name: 'Move down' });
    expect(moveUpButtons[0]).toBeDisabled();
    expect(moveDownButtons[moveDownButtons.length - 1]).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run components/admin/ListEditor.test.tsx`
Expected: FAIL — `ListEditor` doesn't exist yet.

- [ ] **Step 3: Write `components/admin/ListEditor.tsx`**

Note the trailing comma in `<T,>` — required so TypeScript doesn't parse the generic as a JSX tag in a `.tsx` file.

```typescript
'use client';

import styles from './ListEditor.module.css';

export interface ListEditorProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  getKey: (item: T, index: number) => string;
  createItem: () => T;
  addLabel: string;
  renderItem: (item: T, onUpdate: (patch: Partial<T>) => void) => React.ReactNode;
}

export default function ListEditor<T,>({
  items,
  onChange,
  getKey,
  createItem,
  addLabel,
  renderItem,
}: ListEditorProps<T>) {
  const updateAt = (index: number, patch: Partial<T>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeAt = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...items];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };

  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    const next = [...items];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  };

  return (
    <div className={styles.list}>
      {items.map((item, index) => (
        <div key={getKey(item, index)} className={styles.item}>
          {renderItem(item, (patch) => updateAt(index, patch))}
          <div className={styles.controls}>
            <button type="button" onClick={() => moveUp(index)} disabled={index === 0}>
              Move up
            </button>
            <button type="button" onClick={() => moveDown(index)} disabled={index === items.length - 1}>
              Move down
            </button>
            <button type="button" onClick={() => removeAt(index)}>
              Remove
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, createItem()])}>
        {addLabel}
      </button>
    </div>
  );
}
```

```css
/* components/admin/ListEditor.module.css */
.list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.item {
  border: 1px solid var(--color-chrome-mid, #ccc);
  border-radius: 8px;
  padding: 16px;
}

.controls {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.controls button {
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run components/admin/ListEditor.test.tsx`
Expected: all PASS.

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/admin/ListEditor.tsx components/admin/ListEditor.module.css components/admin/ListEditor.test.tsx
git commit -m "feat: add generic ListEditor admin form primitive"
```

---

### Task 3: `SaveBar`

**Files:**
- Create: `components/admin/SaveBar.tsx`, `components/admin/SaveBar.module.css`, `components/admin/SaveBar.test.tsx`

**Interfaces:**
- Consumes: `siteConfig` from `@/content/site` (test fixture only), `POST /api/admin/save` (already built, from the prior plan).
- Produces: `SaveBar({ content: SiteConfig; onSaved?: () => void })` — consumed by `AdminDashboard` (Task 10).

- [ ] **Step 1: Write the failing tests**

```typescript
// components/admin/SaveBar.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SaveBar from './SaveBar';
import { siteConfig } from '@/content/site';

describe('SaveBar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('posts the content to /api/admin/save and shows a success message', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ ok: true, commitSha: 'abc123' }), { status: 200 }));
    const onSaved = vi.fn();
    const user = userEvent.setup();
    render(<SaveBar content={siteConfig} onSaved={onSaved} />);

    await user.click(screen.getByRole('button', { name: 'Save & Publish' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: siteConfig, images: [] }),
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Saved');
    expect(onSaved).toHaveBeenCalled();
  });

  it('shows the API error message when the save is rejected', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: 'Invalid request payload.' }), { status: 400 })
    );
    const user = userEvent.setup();
    render(<SaveBar content={siteConfig} />);

    await user.click(screen.getByRole('button', { name: 'Save & Publish' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid request payload.');
  });

  it('shows a network-error message when fetch rejects', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));
    const user = userEvent.setup();
    render(<SaveBar content={siteConfig} />);

    await user.click(screen.getByRole('button', { name: 'Save & Publish' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Network error');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run components/admin/SaveBar.test.tsx`
Expected: FAIL — `SaveBar` doesn't exist yet.

- [ ] **Step 3: Write `components/admin/SaveBar.tsx`**

```typescript
'use client';

import { useState } from 'react';
import type { SiteConfig } from '@/content/site';
import styles from './SaveBar.module.css';

export interface SaveBarProps {
  content: SiteConfig;
  onSaved?: () => void;
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export default function SaveBar({ content, onSaved }: SaveBarProps) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setStatus('saving');
    setError(null);
    try {
      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, images: [] }),
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

```css
/* components/admin/SaveBar.module.css */
.bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background-color: var(--color-bg-elevated, #fff);
  border: 1px solid var(--color-chrome-mid, #ccc);
  border-radius: 12px;
  margin-bottom: 24px;
}

.bar button {
  padding: 10px 20px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
}

.success {
  color: #2e7d32;
}

.error {
  color: #c0392b;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run components/admin/SaveBar.test.tsx`
Expected: all PASS.

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/admin/SaveBar.tsx components/admin/SaveBar.module.css components/admin/SaveBar.test.tsx
git commit -m "feat: add SaveBar admin component wired to /api/admin/save"
```

---

### Task 4: `BasicsSection`

**Files:**
- Create: `app/admin/sections/Section.module.css` (shared by this and every section task below)
- Create: `app/admin/sections/BasicsSection.tsx`, `app/admin/sections/BasicsSection.test.tsx`

**Interfaces:**
- Consumes: `TextField`, `TextAreaField` (Task 1).
- Produces: `BasicsFields` type and `BasicsSection({ fields: BasicsFields; onChange: (fields: BasicsFields) => void })` — consumed by `AdminDashboard` (Task 10), which is responsible for flattening `SiteConfig`'s scattered top-level fields plus `seo.title`/`seo.description` into this shape and back.

- [ ] **Step 1: Write the failing test**

```typescript
// app/admin/sections/BasicsSection.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BasicsSection, { type BasicsFields } from './BasicsSection';

const fields: BasicsFields = {
  businessName: 'CAB Premium Detailing',
  phoneDisplay: '(406) 609-5321',
  phoneHref: 'tel:+14066095321',
  instagramDmUrl: 'https://ig.me/m/cab.premiumdetailing',
  instagramPendingLabel: 'Instagram DM — coming soon',
  seoTitle: 'CAB Premium Detailing',
  seoDescription: 'Mobile detailing.',
};

describe('BasicsSection', () => {
  it('renders current values', () => {
    render(<BasicsSection fields={fields} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Business Name')).toHaveValue(fields.businessName);
    expect(screen.getByLabelText(/Instagram DM URL/)).toHaveValue(fields.instagramDmUrl);
  });

  it('calls onChange with an updated field, preserving the rest', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<BasicsSection fields={fields} onChange={onChange} />);
    await user.type(screen.getByLabelText('Business Name'), 'X');
    expect(onChange).toHaveBeenLastCalledWith({ ...fields, businessName: `${fields.businessName}X` });
  });

  it('converts a blank Instagram DM URL to null', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<BasicsSection fields={fields} onChange={onChange} />);
    await user.clear(screen.getByLabelText(/Instagram DM URL/));
    expect(onChange).toHaveBeenLastCalledWith({ ...fields, instagramDmUrl: null });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run app/admin/sections/BasicsSection.test.tsx`
Expected: FAIL — `BasicsSection` doesn't exist yet.

- [ ] **Step 3: Write the shared section stylesheet and `BasicsSection.tsx`**

```css
/* app/admin/sections/Section.module.css */
.section {
  background-color: var(--color-bg-elevated, #fff);
  border: 1px solid var(--color-chrome-mid, #ccc);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.section h2 {
  margin-top: 0;
}
```

```typescript
// app/admin/sections/BasicsSection.tsx
'use client';

import TextField from '@/components/admin/TextField';
import TextAreaField from '@/components/admin/TextAreaField';
import styles from './Section.module.css';

export interface BasicsFields {
  businessName: string;
  phoneDisplay: string;
  phoneHref: string;
  instagramDmUrl: string | null;
  instagramPendingLabel: string;
  seoTitle: string;
  seoDescription: string;
}

export interface BasicsSectionProps {
  fields: BasicsFields;
  onChange: (fields: BasicsFields) => void;
}

export default function BasicsSection({ fields, onChange }: BasicsSectionProps) {
  const update = (patch: Partial<BasicsFields>) => onChange({ ...fields, ...patch });

  return (
    <section className={styles.section}>
      <h2>Site Basics</h2>
      <TextField label="Business Name" value={fields.businessName} onChange={(businessName) => update({ businessName })} />
      <TextField
        label="Phone (display)"
        value={fields.phoneDisplay}
        onChange={(phoneDisplay) => update({ phoneDisplay })}
      />
      <TextField label="Phone (tel: link)" value={fields.phoneHref} onChange={(phoneHref) => update({ phoneHref })} />
      <TextField
        label="Instagram DM URL (leave blank to show 'coming soon')"
        value={fields.instagramDmUrl ?? ''}
        onChange={(value) => update({ instagramDmUrl: value.trim() === '' ? null : value })}
      />
      <TextField
        label="Instagram Pending Label"
        value={fields.instagramPendingLabel}
        onChange={(instagramPendingLabel) => update({ instagramPendingLabel })}
      />
      <TextField label="Page Title (browser tab)" value={fields.seoTitle} onChange={(seoTitle) => update({ seoTitle })} />
      <TextAreaField
        label="Page Description (search results)"
        value={fields.seoDescription}
        onChange={(seoDescription) => update({ seoDescription })}
      />
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run app/admin/sections/BasicsSection.test.tsx`
Expected: all PASS.

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/admin/sections/Section.module.css app/admin/sections/BasicsSection.tsx app/admin/sections/BasicsSection.test.tsx
git commit -m "feat: add admin BasicsSection (business info + SEO)"
```

---

### Task 5: `NavSection`

**Files:**
- Create: `app/admin/sections/NavSection.tsx`, `app/admin/sections/NavSection.test.tsx`

**Interfaces:**
- Consumes: `TextField` (Task 1), `ListEditor` (Task 2), `NavConfig`/`NavLink` types from `@/content/site`.
- Produces: `NavSection({ content: NavConfig; onChange: (nav: NavConfig) => void })` — consumed by `AdminDashboard` (Task 10).

- [ ] **Step 1: Write the failing test**

```typescript
// app/admin/sections/NavSection.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavSection from './NavSection';
import type { NavConfig } from '@/content/site';

const content: NavConfig = {
  links: [{ href: '#services', label: 'Services' }],
  callButtonLabel: 'Call Now',
  instagramButtonLabel: 'DM on Instagram',
};

describe('NavSection', () => {
  it('renders the nav link fields and button labels', () => {
    render(<NavSection content={content} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Label')).toHaveValue('Services');
    expect(screen.getByLabelText('Link (e.g. #services)')).toHaveValue('#services');
    expect(screen.getByLabelText('Call Button Label')).toHaveValue('Call Now');
  });

  it('calls onChange with an appended link when Add Nav Link is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<NavSection content={content} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Add Nav Link' }));
    expect(onChange).toHaveBeenCalledWith({
      ...content,
      links: [...content.links, { href: '#', label: 'New Link' }],
    });
  });

  it('calls onChange with an updated button label, preserving links', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<NavSection content={content} onChange={onChange} />);
    await user.type(screen.getByLabelText('Call Button Label'), 'X');
    expect(onChange).toHaveBeenLastCalledWith({ ...content, callButtonLabel: 'Call NowX' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run app/admin/sections/NavSection.test.tsx`
Expected: FAIL — `NavSection` doesn't exist yet.

- [ ] **Step 3: Write `app/admin/sections/NavSection.tsx`**

```typescript
'use client';

import type { NavConfig, NavLink } from '@/content/site';
import TextField from '@/components/admin/TextField';
import ListEditor from '@/components/admin/ListEditor';
import styles from './Section.module.css';

export interface NavSectionProps {
  content: NavConfig;
  onChange: (nav: NavConfig) => void;
}

export default function NavSection({ content, onChange }: NavSectionProps) {
  return (
    <section className={styles.section}>
      <h2>Navigation</h2>
      <ListEditor<NavLink>
        items={content.links}
        onChange={(links) => onChange({ ...content, links })}
        getKey={(link, index) => `${link.href}-${index}`}
        createItem={() => ({ href: '#', label: 'New Link' })}
        addLabel="Add Nav Link"
        renderItem={(link, onUpdate) => (
          <>
            <TextField label="Label" value={link.label} onChange={(label) => onUpdate({ label })} />
            <TextField label="Link (e.g. #services)" value={link.href} onChange={(href) => onUpdate({ href })} />
          </>
        )}
      />
      <TextField
        label="Call Button Label"
        value={content.callButtonLabel}
        onChange={(callButtonLabel) => onChange({ ...content, callButtonLabel })}
      />
      <TextField
        label="Instagram Button Label"
        value={content.instagramButtonLabel}
        onChange={(instagramButtonLabel) => onChange({ ...content, instagramButtonLabel })}
      />
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run app/admin/sections/NavSection.test.tsx`
Expected: all PASS.

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/admin/sections/NavSection.tsx app/admin/sections/NavSection.test.tsx
git commit -m "feat: add admin NavSection"
```

---

### Task 6: `HeroSection`

**Files:**
- Create: `app/admin/sections/HeroSection.tsx`, `app/admin/sections/HeroSection.test.tsx`

**Interfaces:**
- Consumes: `TextField`, `TextAreaField` (Task 1), `HeroConfig` type from `@/content/site`.
- Produces: `HeroSection({ content: HeroConfig; onChange: (hero: HeroConfig) => void })` — consumed by `AdminDashboard` (Task 10).

- [ ] **Step 1: Write the failing test**

```typescript
// app/admin/sections/HeroSection.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HeroSection from './HeroSection';
import type { HeroConfig } from '@/content/site';

const content: HeroConfig = {
  badge: 'Mobile & Premium Service',
  headline: 'Premium Detailing for Cars, Airplanes & Boats',
  subtitle: 'Mobile service. Unmatched quality.',
  instagramButtonLabel: 'Book via Instagram DM',
  callButtonPrefix: 'Call / Text ',
};

describe('HeroSection', () => {
  it('renders current values', () => {
    render(<HeroSection content={content} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Badge')).toHaveValue(content.badge);
    expect(screen.getByLabelText('Headline')).toHaveValue(content.headline);
    expect(screen.getByLabelText('Subtitle')).toHaveValue(content.subtitle);
  });

  it('calls onChange with an updated field, preserving the rest', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<HeroSection content={content} onChange={onChange} />);
    await user.type(screen.getByLabelText('Badge'), 'X');
    expect(onChange).toHaveBeenLastCalledWith({ ...content, badge: `${content.badge}X` });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run app/admin/sections/HeroSection.test.tsx`
Expected: FAIL — `HeroSection` doesn't exist yet.

- [ ] **Step 3: Write `app/admin/sections/HeroSection.tsx`**

```typescript
'use client';

import type { HeroConfig } from '@/content/site';
import TextField from '@/components/admin/TextField';
import TextAreaField from '@/components/admin/TextAreaField';
import styles from './Section.module.css';

export interface HeroSectionProps {
  content: HeroConfig;
  onChange: (hero: HeroConfig) => void;
}

export default function HeroSection({ content, onChange }: HeroSectionProps) {
  const update = (patch: Partial<HeroConfig>) => onChange({ ...content, ...patch });

  return (
    <section className={styles.section}>
      <h2>Hero</h2>
      <TextField label="Badge" value={content.badge} onChange={(badge) => update({ badge })} />
      <TextField label="Headline" value={content.headline} onChange={(headline) => update({ headline })} />
      <TextAreaField label="Subtitle" value={content.subtitle} onChange={(subtitle) => update({ subtitle })} />
      <TextField
        label="Instagram Button Label"
        value={content.instagramButtonLabel}
        onChange={(instagramButtonLabel) => update({ instagramButtonLabel })}
      />
      <TextField
        label="Call Button Prefix"
        value={content.callButtonPrefix}
        onChange={(callButtonPrefix) => update({ callButtonPrefix })}
      />
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run app/admin/sections/HeroSection.test.tsx`
Expected: all PASS.

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/admin/sections/HeroSection.tsx app/admin/sections/HeroSection.test.tsx
git commit -m "feat: add admin HeroSection"
```

---

### Task 7: `ReelsSection`

**Files:**
- Create: `app/admin/sections/ReelsSection.tsx`, `app/admin/sections/ReelsSection.test.tsx`

**Interfaces:**
- Consumes: `TextField` (Task 1), `ListEditor` (Task 2), `ReelsConfig`/`ReelItem` types from `@/content/site`.
- Produces: `ReelsSection({ content: ReelsConfig; onChange: (reels: ReelsConfig) => void })` — consumed by `AdminDashboard` (Task 10).

- [ ] **Step 1: Write the failing test**

```typescript
// app/admin/sections/ReelsSection.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReelsSection from './ReelsSection';
import type { ReelsConfig } from '@/content/site';

const content: ReelsConfig = {
  heading: 'Video Showcase',
  subtitle: 'Watch our process in action',
  comingSoonLabel: 'Coming soon',
  items: [{ id: 'reel-1', caption: 'Full Detail Walkthrough', embedUrl: 'https://www.instagram.com/reel/abc/' }],
};

describe('ReelsSection', () => {
  it('renders current values', () => {
    render(<ReelsSection content={content} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Heading')).toHaveValue(content.heading);
    expect(screen.getByLabelText('Caption')).toHaveValue('Full Detail Walkthrough');
    expect(screen.getByLabelText('Instagram/TikTok URL')).toHaveValue('https://www.instagram.com/reel/abc/');
  });

  it('calls onChange with an appended reel when Add Reel is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ReelsSection content={content} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Add Reel' }));
    const [updated] = onChange.mock.calls[0];
    expect(updated.items).toHaveLength(2);
    expect(updated.items[1]).toMatchObject({ caption: '', embedUrl: null });
  });

  it('converts a blank reel URL to null', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ReelsSection content={content} onChange={onChange} />);
    await user.clear(screen.getByLabelText('Instagram/TikTok URL'));
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.items[0].embedUrl).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run app/admin/sections/ReelsSection.test.tsx`
Expected: FAIL — `ReelsSection` doesn't exist yet.

- [ ] **Step 3: Write `app/admin/sections/ReelsSection.tsx`**

```typescript
'use client';

import type { ReelsConfig, ReelItem } from '@/content/site';
import TextField from '@/components/admin/TextField';
import ListEditor from '@/components/admin/ListEditor';
import styles from './Section.module.css';

export interface ReelsSectionProps {
  content: ReelsConfig;
  onChange: (reels: ReelsConfig) => void;
}

export default function ReelsSection({ content, onChange }: ReelsSectionProps) {
  const update = (patch: Partial<ReelsConfig>) => onChange({ ...content, ...patch });

  return (
    <section className={styles.section}>
      <h2>Video Showcase</h2>
      <TextField label="Heading" value={content.heading} onChange={(heading) => update({ heading })} />
      <TextField label="Subtitle" value={content.subtitle} onChange={(subtitle) => update({ subtitle })} />
      <TextField
        label="Coming Soon Label"
        value={content.comingSoonLabel}
        onChange={(comingSoonLabel) => update({ comingSoonLabel })}
      />
      <ListEditor<ReelItem>
        items={content.items}
        onChange={(items) => update({ items })}
        getKey={(item) => item.id}
        createItem={() => ({ id: `reel-${Date.now()}`, caption: '', embedUrl: null })}
        addLabel="Add Reel"
        renderItem={(item, onUpdate) => (
          <>
            <TextField label="Caption" value={item.caption} onChange={(caption) => onUpdate({ caption })} />
            <TextField
              label="Instagram/TikTok URL"
              value={item.embedUrl ?? ''}
              onChange={(value) => onUpdate({ embedUrl: value.trim() === '' ? null : value })}
            />
          </>
        )}
      />
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run app/admin/sections/ReelsSection.test.tsx`
Expected: all PASS.

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/admin/sections/ReelsSection.tsx app/admin/sections/ReelsSection.test.tsx
git commit -m "feat: add admin ReelsSection"
```

---

### Task 8: `ReviewsSection`

**Files:**
- Create: `app/admin/sections/ReviewsSection.tsx`, `app/admin/sections/ReviewsSection.test.tsx`

**Interfaces:**
- Consumes: `TextField` (Task 1), `GoogleReviewConfig` type from `@/content/site`.
- Produces: `ReviewsSection({ content: GoogleReviewConfig; onChange: (googleReview: GoogleReviewConfig) => void })` — consumed by `AdminDashboard` (Task 10).

- [ ] **Step 1: Write the failing test**

```typescript
// app/admin/sections/ReviewsSection.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewsSection from './ReviewsSection';
import type { GoogleReviewConfig } from '@/content/site';

const content: GoogleReviewConfig = {
  rating: 4.9,
  reviewCount: 50,
  profileUrl: 'https://maps.app.goo.gl/example',
  heading: 'What Our Clients Say',
  countTemplate: '({count}+ Google Reviews)',
  viewButtonLabel: 'View on Google',
  pendingLabel: 'Google reviews link coming soon',
};

describe('ReviewsSection', () => {
  it('renders current values, including numbers as text', () => {
    render(<ReviewsSection content={content} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Heading')).toHaveValue(content.heading);
    expect(screen.getByLabelText(/Rating/)).toHaveValue('4.9');
    expect(screen.getByLabelText('Review Count')).toHaveValue('50');
  });

  it('parses the rating field back into a number', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ReviewsSection content={content} onChange={onChange} />);
    const ratingField = screen.getByLabelText(/Rating/);
    await user.clear(ratingField);
    await user.type(ratingField, '5');
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.rating).toBe(5);
  });

  it('converts a blank profile URL to null', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ReviewsSection content={content} onChange={onChange} />);
    await user.clear(screen.getByLabelText(/Google Profile URL/));
    expect(onChange).toHaveBeenLastCalledWith({ ...content, profileUrl: null });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run app/admin/sections/ReviewsSection.test.tsx`
Expected: FAIL — `ReviewsSection` doesn't exist yet.

- [ ] **Step 3: Write `app/admin/sections/ReviewsSection.tsx`**

```typescript
'use client';

import type { GoogleReviewConfig } from '@/content/site';
import TextField from '@/components/admin/TextField';
import styles from './Section.module.css';

export interface ReviewsSectionProps {
  content: GoogleReviewConfig;
  onChange: (googleReview: GoogleReviewConfig) => void;
}

export default function ReviewsSection({ content, onChange }: ReviewsSectionProps) {
  const update = (patch: Partial<GoogleReviewConfig>) => onChange({ ...content, ...patch });

  return (
    <section className={styles.section}>
      <h2>Reviews</h2>
      <TextField label="Heading" value={content.heading} onChange={(heading) => update({ heading })} />
      <TextField
        label="Rating (e.g. 4.9)"
        value={String(content.rating)}
        onChange={(value) => update({ rating: Number(value) || 0 })}
      />
      <TextField
        label="Review Count"
        value={String(content.reviewCount)}
        onChange={(value) => update({ reviewCount: Number(value) || 0 })}
      />
      <TextField
        label="Google Profile URL (leave blank to show 'coming soon')"
        value={content.profileUrl ?? ''}
        onChange={(value) => update({ profileUrl: value.trim() === '' ? null : value })}
      />
      <TextField
        label="Review Count Template (use {count})"
        value={content.countTemplate}
        onChange={(countTemplate) => update({ countTemplate })}
      />
      <TextField
        label="View Button Label"
        value={content.viewButtonLabel}
        onChange={(viewButtonLabel) => update({ viewButtonLabel })}
      />
      <TextField label="Pending Label" value={content.pendingLabel} onChange={(pendingLabel) => update({ pendingLabel })} />
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run app/admin/sections/ReviewsSection.test.tsx`
Expected: all PASS.

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/admin/sections/ReviewsSection.tsx app/admin/sections/ReviewsSection.test.tsx
git commit -m "feat: add admin ReviewsSection"
```

---

### Task 9: `ContactSection` and `FooterSection`

**Files:**
- Create: `app/admin/sections/ContactSection.tsx`, `app/admin/sections/ContactSection.test.tsx`
- Create: `app/admin/sections/FooterSection.tsx`, `app/admin/sections/FooterSection.test.tsx`

**Interfaces:**
- Consumes: `TextField`, `TextAreaField` (Task 1), `ContactConfig`/`FooterConfig` types from `@/content/site`.
- Produces: `ContactSection({ content: ContactConfig; onChange: (contact: ContactConfig) => void })`, `FooterSection({ content: FooterConfig; onChange: (footer: FooterConfig) => void })` — both consumed by `AdminDashboard` (Task 10).

- [ ] **Step 1: Write the failing tests**

```typescript
// app/admin/sections/ContactSection.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactSection from './ContactSection';
import type { ContactConfig } from '@/content/site';

const content: ContactConfig = {
  heading: 'Ready to Book Your Detail?',
  body: 'DM us on Instagram or call/text.',
  instagramButtonLabel: 'DM Us on Instagram',
  callButtonPrefix: 'Call / Text ',
};

describe('ContactSection', () => {
  it('renders current values', () => {
    render(<ContactSection content={content} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Heading')).toHaveValue(content.heading);
    expect(screen.getByLabelText('Body')).toHaveValue(content.body);
  });

  it('calls onChange with an updated field, preserving the rest', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ContactSection content={content} onChange={onChange} />);
    await user.type(screen.getByLabelText('Heading'), 'X');
    expect(onChange).toHaveBeenLastCalledWith({ ...content, heading: `${content.heading}X` });
  });
});
```

```typescript
// app/admin/sections/FooterSection.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FooterSection from './FooterSection';
import type { FooterConfig } from '@/content/site';

const content: FooterConfig = {
  copyrightSuffix: 'All rights reserved.',
  instagramLabel: 'Instagram',
  googleLabel: 'Google Page',
};

describe('FooterSection', () => {
  it('renders current values', () => {
    render(<FooterSection content={content} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Copyright Suffix')).toHaveValue(content.copyrightSuffix);
  });

  it('calls onChange with an updated field, preserving the rest', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<FooterSection content={content} onChange={onChange} />);
    await user.type(screen.getByLabelText('Copyright Suffix'), 'X');
    expect(onChange).toHaveBeenLastCalledWith({ ...content, copyrightSuffix: `${content.copyrightSuffix}X` });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run app/admin/sections/ContactSection.test.tsx app/admin/sections/FooterSection.test.tsx`
Expected: FAIL — neither component exists yet.

- [ ] **Step 3: Write `app/admin/sections/ContactSection.tsx`**

```typescript
'use client';

import type { ContactConfig } from '@/content/site';
import TextField from '@/components/admin/TextField';
import TextAreaField from '@/components/admin/TextAreaField';
import styles from './Section.module.css';

export interface ContactSectionProps {
  content: ContactConfig;
  onChange: (contact: ContactConfig) => void;
}

export default function ContactSection({ content, onChange }: ContactSectionProps) {
  const update = (patch: Partial<ContactConfig>) => onChange({ ...content, ...patch });

  return (
    <section className={styles.section}>
      <h2>Contact</h2>
      <TextField label="Heading" value={content.heading} onChange={(heading) => update({ heading })} />
      <TextAreaField label="Body" value={content.body} onChange={(body) => update({ body })} />
      <TextField
        label="Instagram Button Label"
        value={content.instagramButtonLabel}
        onChange={(instagramButtonLabel) => update({ instagramButtonLabel })}
      />
      <TextField
        label="Call Button Prefix"
        value={content.callButtonPrefix}
        onChange={(callButtonPrefix) => update({ callButtonPrefix })}
      />
    </section>
  );
}
```

- [ ] **Step 4: Write `app/admin/sections/FooterSection.tsx`**

```typescript
'use client';

import type { FooterConfig } from '@/content/site';
import TextField from '@/components/admin/TextField';
import styles from './Section.module.css';

export interface FooterSectionProps {
  content: FooterConfig;
  onChange: (footer: FooterConfig) => void;
}

export default function FooterSection({ content, onChange }: FooterSectionProps) {
  const update = (patch: Partial<FooterConfig>) => onChange({ ...content, ...patch });

  return (
    <section className={styles.section}>
      <h2>Footer</h2>
      <TextField
        label="Copyright Suffix"
        value={content.copyrightSuffix}
        onChange={(copyrightSuffix) => update({ copyrightSuffix })}
      />
      <TextField
        label="Instagram Label"
        value={content.instagramLabel}
        onChange={(instagramLabel) => update({ instagramLabel })}
      />
      <TextField label="Google Label" value={content.googleLabel} onChange={(googleLabel) => update({ googleLabel })} />
    </section>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run app/admin/sections/ContactSection.test.tsx app/admin/sections/FooterSection.test.tsx`
Expected: all PASS.

- [ ] **Step 6: Run the full suite and typecheck**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/admin/sections/ContactSection.tsx app/admin/sections/ContactSection.test.tsx app/admin/sections/FooterSection.tsx app/admin/sections/FooterSection.test.tsx
git commit -m "feat: add admin ContactSection and FooterSection"
```

---

### Task 10: `AdminDashboard` composition, replace the stub page, final verification

**Files:**
- Create: `app/admin/AdminDashboard.tsx`, `app/admin/AdminDashboard.module.css`, `app/admin/AdminDashboard.test.tsx`
- Modify: `app/admin/page.tsx`
- Modify: `app/admin/page.test.tsx`

**Interfaces:**
- Consumes: `SaveBar` (Task 3), `BasicsSection`/`BasicsFields` (Task 4), `NavSection` (Task 5), `HeroSection` (Task 6), `ReelsSection` (Task 7), `ReviewsSection` (Task 8), `ContactSection`/`FooterSection` (Task 9), the existing `LogoutButton` at `app/admin/LogoutButton.tsx` (from the prior plan), `SiteConfig` type and `siteConfig` value from `@/content/site`.
- Produces: `AdminDashboard({ initialContent: SiteConfig })` — the default export `app/admin/page.tsx` renders.

- [ ] **Step 1: Write the failing test**

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
    expect(screen.getByRole('heading', { name: 'Navigation' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hero' })).toBeInTheDocument();
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
    expect(body.content.gallery).toEqual(siteConfig.gallery);
    expect(body.images).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run app/admin/AdminDashboard.test.tsx`
Expected: FAIL — `AdminDashboard` doesn't exist yet.

- [ ] **Step 3: Write `app/admin/AdminDashboard.tsx`**

```typescript
'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SiteConfig } from '@/content/site';
import SaveBar from '@/components/admin/SaveBar';
import BasicsSection, { type BasicsFields } from './sections/BasicsSection';
import NavSection from './sections/NavSection';
import HeroSection from './sections/HeroSection';
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

  const updateContent = useCallback((patch: Partial<SiteConfig>) => {
    setContent((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }, []);

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

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1>Admin Dashboard</h1>
        <LogoutButton />
      </div>
      <SaveBar content={content} onSaved={() => setDirty(false)} />
      <BasicsSection fields={basicsFields} onChange={handleBasicsChange} />
      <NavSection content={content.nav} onChange={(nav) => updateContent({ nav })} />
      <HeroSection content={content.hero} onChange={(hero) => updateContent({ hero })} />
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

```css
/* app/admin/AdminDashboard.module.css */
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 24px 96px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
```

- [ ] **Step 4: Replace the stub `app/admin/page.tsx`**

```typescript
import { siteConfig } from '@/content/site';
import AdminDashboard from './AdminDashboard';

export default function AdminDashboardPage() {
  return <AdminDashboard initialContent={siteConfig} />;
}
```

- [ ] **Step 5: Update `app/admin/page.test.tsx`**

```typescript
// app/admin/page.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import AdminDashboardPage from './page';

describe('AdminDashboardPage', () => {
  it('renders the dashboard heading, at least one real section, and a logout button', () => {
    render(<AdminDashboardPage />);
    expect(screen.getByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Site Basics' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run the new/updated tests to verify they pass**

Run: `npx vitest run app/admin/AdminDashboard.test.tsx app/admin/page.test.tsx`
Expected: all PASS.

- [ ] **Step 7: Run the full suite, typecheck, and production build**

Run: `npx vitest run`
Expected: all tests PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 8: Commit**

```bash
git add app/admin/AdminDashboard.tsx app/admin/AdminDashboard.module.css app/admin/AdminDashboard.test.tsx app/admin/page.tsx app/admin/page.test.tsx
git commit -m "feat: compose admin dashboard from all text sections, replacing the stub page"
```

## Self-review notes

- **Spec coverage:** Implements the flat/textual subset of spec section 4 (dashboard shell, Save & Publish wiring, move-up/down list editing, success/error messaging matching the spec's own copy). Images, gallery, before/after, and pricing are explicitly out of scope per this plan's stated goal — a follow-up plan builds those on top of this foundation.
- **Placeholder scan:** No TBDs; every step has complete, real code.
- **Type consistency:** `TextField`/`TextAreaField`/`ListEditor`'s prop signatures are defined once in Task 1/2 and reused verbatim by every section task; each section's `content`/`onChange` shape is checked against the exact `SiteConfig` nested interfaces it edits (cross-referenced against `content/site.ts`).
- **Scope check:** Single subsystem (textual admin sections), ready to execute as one plan. Images/gallery/before-after/pricing are the next plan.
