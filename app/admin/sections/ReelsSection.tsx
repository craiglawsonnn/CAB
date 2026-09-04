'use client';

import type { ReelsConfig, ReelItem } from '@/content/site';
import TextField from '@/components/admin/TextField';
import ListEditor from '@/components/admin/ListEditor';
import styles from './Section.module.css';

export interface ReelsSectionProps {
  content: ReelsConfig;
  onChange: (reels: ReelsConfig) => void;
}

export default function ReelsSection({ content, onChange }: ReelsSectionProps) {
  const update = (patch: Partial<ReelsConfig>) => onChange({ ...content, ...patch });

  return (
    <section className={styles.section}>
      <h2>Video Showcase</h2>
      <TextField label="Heading" value={content.heading} onChange={(heading) => update({ heading })} />
      <TextField label="Subtitle" value={content.subtitle} onChange={(subtitle) => update({ subtitle })} />
      <TextField
        label="Coming Soon Label"
        value={content.comingSoonLabel}
        onChange={(comingSoonLabel) => update({ comingSoonLabel })}
      />
      <ListEditor<ReelItem>
        items={content.items}
        onChange={(items) => update({ items })}
        getKey={(item) => item.id}
        createItem={() => ({ id: `reel-${Date.now()}`, caption: '', embedUrl: null })}
        addLabel="Add Reel"
        renderItem={(item, onUpdate) => (
          <>
            <TextField label="Caption" value={item.caption} onChange={(caption) => onUpdate({ caption })} />
            <TextField
              label="Instagram/TikTok URL"
              value={item.embedUrl ?? ''}
              onChange={(value) => onUpdate({ embedUrl: value.trim() === '' ? null : value })}
            />
          </>
        )}
      />
    </section>
  );
}
