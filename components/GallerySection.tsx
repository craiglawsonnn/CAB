import type { GalleryImage } from '@/content/site';
import styles from './GallerySection.module.css';

export interface GallerySectionProps {
  images: GalleryImage[];
  heading: string;
  subtitle: string;
}

export default function GallerySection({ images, heading, subtitle }: GallerySectionProps) {
  return (
    <section id="gallery" className={styles.section}>
      <div className={styles.inner}>
        <h2>{heading}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
        <div className={styles.grid}>
          {images.map((image) => (
            <figure key={image.id} className={styles.tile}>
              <img src={image.src} alt={image.alt} />
              <figcaption>{image.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
