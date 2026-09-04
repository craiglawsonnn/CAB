'use client';

import TextField from '@/components/admin/TextField';
import TextAreaField from '@/components/admin/TextAreaField';
import styles from './Section.module.css';

export interface BasicsFields {
  businessName: string;
  phoneDisplay: string;
  phoneHref: string;
  instagramDmUrl: string | null;
  instagramPendingLabel: string;
  seoTitle: string;
  seoDescription: string;
}

export interface BasicsSectionProps {
  fields: BasicsFields;
  onChange: (fields: BasicsFields) => void;
}

export default function BasicsSection({ fields, onChange }: BasicsSectionProps) {
  const update = (patch: Partial<BasicsFields>) => onChange({ ...fields, ...patch });

  return (
    <section className={styles.section}>
      <h2>Site Basics</h2>
      <TextField label="Business Name" value={fields.businessName} onChange={(businessName) => update({ businessName })} />
      <TextField
        label="Phone (display)"
        value={fields.phoneDisplay}
        onChange={(phoneDisplay) => update({ phoneDisplay })}
      />
      <TextField label="Phone (tel: link)" value={fields.phoneHref} onChange={(phoneHref) => update({ phoneHref })} />
      <TextField
        label="Instagram DM URL (leave blank to show 'coming soon')"
        value={fields.instagramDmUrl ?? ''}
        onChange={(value) => update({ instagramDmUrl: value.trim() === '' ? null : value })}
      />
      <TextField
        label="Instagram Pending Label"
        value={fields.instagramPendingLabel}
        onChange={(instagramPendingLabel) => update({ instagramPendingLabel })}
      />
      <TextField label="Page Title (browser tab)" value={fields.seoTitle} onChange={(seoTitle) => update({ seoTitle })} />
      <TextAreaField
        label="Page Description (search results)"
        value={fields.seoDescription}
        onChange={(seoDescription) => update({ seoDescription })}
      />
    </section>
  );
}
