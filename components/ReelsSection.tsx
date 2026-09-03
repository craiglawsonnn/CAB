import type { ReelItem } from '@/content/site';
import ReelEmbed from './ReelEmbed';
import styles from './ReelsSection.module.css';

export interface ReelsSectionProps {
  reels: ReelItem[];
  heading: string;
  subtitle: string;
  comingSoonLabel: string;
}

export default function ReelsSection({
  reels,
  heading,
  subtitle,
  comingSoonLabel,
}: ReelsSectionProps) {
  return (
    <section id="social-showcase" className={styles.section}>
      <div className={styles.inner}>
        <h2>{heading}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
        <div className={styles.grid}>
          {reels.map((reel) => (
            <div key={reel.id} className={styles.frame}>
              <ReelEmbed reel={reel} comingSoonLabel={comingSoonLabel} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
