'use client';

import type { GoogleReviewConfig } from '@/content/site';
import TextField from '@/components/admin/TextField';
import NumberField from '@/components/admin/NumberField';
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
      <NumberField label="Rating (e.g. 4.9)" value={content.rating} onChange={(rating) => update({ rating })} />
      <NumberField label="Review Count" value={content.reviewCount} onChange={(reviewCount) => update({ reviewCount })} />
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
