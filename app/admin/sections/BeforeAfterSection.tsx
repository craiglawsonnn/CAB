'use client';

import type { BeforeAfterConfig, BeforeAfterPair } from '@/content/site';
import TextField from '@/components/admin/TextField';
import ImageField from '@/components/admin/ImageField';
import ListEditor from '@/components/admin/ListEditor';
import styles from './Section.module.css';

export interface BeforeAfterSectionProps {
  content: BeforeAfterConfig;
  onChange: (beforeAfter: BeforeAfterConfig) => void;
  onImageSelected: (path: string, file: File) => void;
  onImageRemoved: (path: string) => void;
}

export default function BeforeAfterSection({
  content,
  onChange,
  onImageSelected,
  onImageRemoved,
}: BeforeAfterSectionProps) {
  const update = (patch: Partial<BeforeAfterConfig>) => onChange({ ...content, ...patch });

  const handlePairsChange = (pairs: BeforeAfterPair[]) => {
    const removed = content.pairs.filter((pair) => !pairs.some((next) => next.id === pair.id));
    removed.forEach((pair) => {
      onImageRemoved(pair.beforeSrc);
      onImageRemoved(pair.afterSrc);
    });
    update({ pairs });
  };

  return (
    <section className={styles.section}>
      <h2>Before &amp; After</h2>
      <TextField label="Heading" value={content.heading} onChange={(heading) => update({ heading })} />
      <TextField label="Subtitle" value={content.subtitle} onChange={(subtitle) => update({ subtitle })} />
      <TextField
        label="View More Template (use {count})"
        value={content.viewMoreTemplate}
        onChange={(viewMoreTemplate) => update({ viewMoreTemplate })}
      />
      <TextField
        label="Show Fewer Label"
        value={content.showFewerLabel}
        onChange={(showFewerLabel) => update({ showFewerLabel })}
      />
      <TextField
        label="Before Tag Label"
        value={content.beforeTagLabel}
        onChange={(beforeTagLabel) => update({ beforeTagLabel })}
      />
      <TextField
        label="After Tag Label"
        value={content.afterTagLabel}
        onChange={(afterTagLabel) => update({ afterTagLabel })}
      />
      <TextField
        label="Slider Aria Label Prefix"
        value={content.ariaLabelPrefix}
        onChange={(ariaLabelPrefix) => update({ ariaLabelPrefix })}
      />
      <ListEditor<BeforeAfterPair>
        items={content.pairs}
        onChange={handlePairsChange}
        getKey={(pair) => pair.id}
        createItem={() => {
          const id = `pair-${Date.now()}`;
          return {
            id,
            beforeSrc: `/images/${id}-before.jpg`,
            afterSrc: `/images/${id}-after.jpg`,
            beforeAlt: '',
            afterAlt: '',
            caption: '',
          };
        }}
        addLabel="Add Pair"
        renderItem={(pair, onUpdate) => (
          <>
            <ImageField
              label="Before Photo"
              currentSrc={pair.beforeSrc}
              onFileSelected={(file) => onImageSelected(pair.beforeSrc, file)}
            />
            <TextField
              label="Before Alt Text"
              value={pair.beforeAlt}
              onChange={(beforeAlt) => onUpdate({ beforeAlt })}
            />
            <ImageField
              label="After Photo"
              currentSrc={pair.afterSrc}
              onFileSelected={(file) => onImageSelected(pair.afterSrc, file)}
            />
            <TextField label="After Alt Text" value={pair.afterAlt} onChange={(afterAlt) => onUpdate({ afterAlt })} />
            <TextField label="Caption" value={pair.caption} onChange={(caption) => onUpdate({ caption })} />
          </>
        )}
      />
    </section>
  );
}
