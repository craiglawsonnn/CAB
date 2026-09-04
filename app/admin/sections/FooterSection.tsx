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
