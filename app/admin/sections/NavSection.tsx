'use client';

import type { NavConfig, NavLink } from '@/content/site';
import TextField from '@/components/admin/TextField';
import ListEditor from '@/components/admin/ListEditor';
import styles from './Section.module.css';

export interface NavSectionProps {
  content: NavConfig;
  onChange: (nav: NavConfig) => void;
}

export default function NavSection({ content, onChange }: NavSectionProps) {
  return (
    <section className={styles.section}>
      <h2>Navigation</h2>
      <ListEditor<NavLink>
        items={content.links}
        onChange={(links) => onChange({ ...content, links })}
        getKey={(link, index) => `${link.href}-${index}`}
        createItem={() => ({ href: '#', label: 'New Link' })}
        addLabel="Add Nav Link"
        renderItem={(link, onUpdate) => (
          <>
            <TextField label="Label" value={link.label} onChange={(label) => onUpdate({ label })} />
            <TextField label="Link (e.g. #services)" value={link.href} onChange={(href) => onUpdate({ href })} />
          </>
        )}
      />
      <TextField
        label="Call Button Label"
        value={content.callButtonLabel}
        onChange={(callButtonLabel) => onChange({ ...content, callButtonLabel })}
      />
      <TextField
        label="Instagram Button Label"
        value={content.instagramButtonLabel}
        onChange={(instagramButtonLabel) => onChange({ ...content, instagramButtonLabel })}
      />
    </section>
  );
}
