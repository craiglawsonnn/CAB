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
