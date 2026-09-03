import styles from './Hero.module.css';

export interface HeroProps {
  heroImageSrc: string;
  phoneDisplay: string;
  phoneHref: string;
  instagramDmUrl: string | null;
  instagramPendingLabel: string;
  badge: string;
  headline: string;
  subtitle: string;
  instagramButtonLabel: string;
  callButtonPrefix: string;
}

export default function Hero({
  heroImageSrc,
  phoneDisplay,
  phoneHref,
  instagramDmUrl,
  instagramPendingLabel,
  badge,
  headline,
  subtitle,
  instagramButtonLabel,
  callButtonPrefix,
}: HeroProps) {
  return (
    <section id="hero" className={styles.hero}>
      <img src={heroImageSrc} alt="" className={styles.backgroundImage} aria-hidden="true" />
      <div className={styles.scrim} />
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.content}>
        <span className={`${styles.reveal} ${styles.badge}`} style={{ animationDelay: '0ms' }}>
          {badge}
        </span>
        <h1 className={styles.reveal} style={{ animationDelay: '120ms' }}>
          {headline}
        </h1>
        <p className={`${styles.reveal} ${styles.subtitle}`} style={{ animationDelay: '240ms' }}>
          {subtitle}
        </p>
        <div className={`${styles.reveal} ${styles.actions}`} style={{ animationDelay: '360ms' }}>
          {instagramDmUrl ? (
            <a href={instagramDmUrl} className={styles.btnPrimary}>
              {instagramButtonLabel}
            </a>
          ) : (
            <span className={`${styles.btnPrimary} ${styles.btnDisabled}`} aria-disabled="true">
              {instagramPendingLabel}
            </span>
          )}
          <a href={phoneHref} className={styles.btnSecondary}>
            {callButtonPrefix}
            {phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  );
}
