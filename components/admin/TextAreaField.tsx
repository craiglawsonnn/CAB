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
