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
