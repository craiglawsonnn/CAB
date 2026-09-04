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
