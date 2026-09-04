'use client';

import { useEffect, useState } from 'react';
import styles from './TextField.module.css';

export interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export default function NumberField({ label, value, onChange }: NumberFieldProps) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const handleChange = (text: string) => {
    setDraft(text);
    const parsed = Number(text);
    if (text.trim() !== '' && Number.isFinite(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(event) => handleChange(event.target.value)}
        className={styles.input}
      />
    </label>
  );
}
