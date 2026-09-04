'use client';

import ImageField from '@/components/admin/ImageField';
import styles from './Section.module.css';

export interface SiteImagesSectionProps {
  logoSrc: string;
  heroImageSrc: string;
  onImageSelected: (path: string, file: File) => void;
}

export default function SiteImagesSection({
  logoSrc,
  heroImageSrc,
  onImageSelected,
}: SiteImagesSectionProps) {
  return (
    <section className={styles.section}>
      <h2>Site Images</h2>
      <ImageField label="Logo" currentSrc={logoSrc} onFileSelected={(file) => onImageSelected(logoSrc, file)} />
      <ImageField
        label="Hero Photo"
        currentSrc={heroImageSrc}
        onFileSelected={(file) => onImageSelected(heroImageSrc, file)}
      />
    </section>
  );
}
