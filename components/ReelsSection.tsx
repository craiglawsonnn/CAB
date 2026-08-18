import type { ReelItem } from '@/content/site';
import ReelEmbed from './ReelEmbed';
import styles from './ReelsSection.module.css';

export interface ReelsSectionProps {
  reels: ReelItem[];
}

export default function ReelsSection({ reels }: ReelsSectionProps) {
  return (
    <section id="social-showcase" className={styles.section}>
      <div className={styles.inner}>
        <h2>Video Showcase</h2>
        <p className={styles.subtitle}>Watch our process in action on TikTok &amp; Instagram</p>
        <div className={styles.grid}>
          {reels.map((reel) => (
            <div key={reel.id} className={styles.frame}>
              <ReelEmbed reel={reel} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
