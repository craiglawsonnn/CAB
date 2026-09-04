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
