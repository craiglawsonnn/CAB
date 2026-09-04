'use client';

import { useState } from 'react';
import type { SiteConfig } from '@/content/site';
import { fileToBase64 } from './fileToBase64';
import styles from './SaveBar.module.css';

export interface SaveBarProps {
  content: SiteConfig;
  publishedPaths?: Set<string>;
  pendingImages?: Record<string, File>;
  pendingDeletes?: string[];
  onSaved?: () => void;
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

const MAX_TOTAL_IMAGE_BYTES = 3 * 1024 * 1024; // must match app/api/admin/save/route.ts

function toPublicPath(src: string): string {
  return `public${src}`;
}

function getReferencedImagePaths(content: SiteConfig): string[] {
  return [
    content.logoSrc,
    content.heroImageSrc,
    ...content.gallery.images.map((image) => image.src),
    ...content.beforeAfter.pairs.flatMap((pair) => [pair.beforeSrc, pair.afterSrc]),
  ];
}

export default function SaveBar({
  content,
  publishedPaths = new Set(),
  pendingImages = {},
  pendingDeletes = [],
  onSaved,
}: SaveBarProps) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setStatus('saving');
    setError(null);

    const missing = getReferencedImagePaths(content).filter(
      (path) => !publishedPaths.has(path) && !(path in pendingImages)
    );
    if (missing.length > 0) {
      setStatus('error');
      setError(
        missing.length === 1
          ? '1 photo needs an image selected before publishing.'
          : `${missing.length} photos need an image selected before publishing.`
      );
      return;
    }

    const totalBytes = Object.values(pendingImages).reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
      setStatus('error');
      setError('Selected photos are too large to publish together (3 MB total limit). Remove one or save in smaller batches.');
      return;
    }

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
