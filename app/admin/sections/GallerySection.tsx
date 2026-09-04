'use client';

import type { GalleryConfig, GalleryImage } from '@/content/site';
import TextField from '@/components/admin/TextField';
import ImageField from '@/components/admin/ImageField';
import ListEditor from '@/components/admin/ListEditor';
import styles from './Section.module.css';

export interface GallerySectionProps {
  content: GalleryConfig;
  onChange: (gallery: GalleryConfig) => void;
  onImageSelected: (path: string, file: File) => void;
  onImageRemoved: (path: string) => void;
}

export default function GallerySection({
  content,
  onChange,
  onImageSelected,
  onImageRemoved,
}: GallerySectionProps) {
  const update = (patch: Partial<GalleryConfig>) => onChange({ ...content, ...patch });

  const handleImagesChange = (images: GalleryImage[]) => {
    const removed = content.images.filter((image) => !images.some((next) => next.id === image.id));
    removed.forEach((image) => onImageRemoved(image.src));
    update({ images });
  };

  return (
    <section className={styles.section}>
      <h2>Gallery</h2>
      <TextField label="Heading" value={content.heading} onChange={(heading) => update({ heading })} />
      <TextField label="Subtitle" value={content.subtitle} onChange={(subtitle) => update({ subtitle })} />
      <ListEditor<GalleryImage>
        items={content.images}
        onChange={handleImagesChange}
        getKey={(image) => image.id}
        createItem={() => {
          const id = `gallery-${Date.now()}`;
          return { id, src: `/images/${id}.jpg`, alt: '', caption: '' };
        }}
        addLabel="Add Photo"
        renderItem={(image, onUpdate) => (
          <>
            <ImageField
              label="Photo"
              currentSrc={image.src}
              onFileSelected={(file) => onImageSelected(image.src, file)}
            />
            <TextField label="Alt Text" value={image.alt} onChange={(alt) => onUpdate({ alt })} />
            <TextField label="Caption" value={image.caption} onChange={(caption) => onUpdate({ caption })} />
          </>
        )}
      />
    </section>
  );
}
