import type { BeforeAfterPair } from '@/content/site';
import BeforeAfterSlider from './BeforeAfterSlider';
import styles from './BeforeAfterSection.module.css';

export interface BeforeAfterSectionProps {
  pairs: BeforeAfterPair[];
}

export default function BeforeAfterSection({ pairs }: BeforeAfterSectionProps) {
  return (
    <section id="portfolio" className={styles.section}>
      <div className={styles.inner}>
        <h2>Our Work: Before &amp; After</h2>
        <p className={styles.subtitle}>Drag the divider to see the transformation</p>
        <div className={styles.grid}>
          {pairs.map((pair) => (
            <BeforeAfterSlider key={pair.id} pair={pair} />
          ))}
        </div>
      </div>
    </section>
  );
}
