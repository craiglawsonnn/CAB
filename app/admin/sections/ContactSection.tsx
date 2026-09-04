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
