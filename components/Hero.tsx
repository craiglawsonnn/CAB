import styles from './Hero.module.css';

export interface HeroProps {
  heroImageSrc: string;
  phoneDisplay: string;
  phoneHref: string;
  instagramDmUrl: string | null;
}

export default function Hero({
  heroImageSrc,
  phoneDisplay,
  phoneHref,
  instagramDmUrl,
}: HeroProps) {
  return (
    <section id="hero" className={styles.hero}>
      <img src={heroImageSrc} alt="" className={styles.backgroundImage} aria-hidden="true" />
      <div className={styles.scrim} />
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.content}>
        <span className={`${styles.reveal} ${styles.badge}`} style={{ animationDelay: '0ms' }}>
          Mobile & Premium Service
        </span>
        <h1 className={styles.reveal} style={{ animationDelay: '120ms' }}>
          Premium Detailing for Cars, Airplanes &amp; Boats
        </h1>
        <p className={`${styles.reveal} ${styles.subtitle}`} style={{ animationDelay: '240ms' }}>
          Mobile service. Unmatched quality. Restoring high-end vehicles to showroom perfection.
        </p>
        <div className={`${styles.reveal} ${styles.actions}`} style={{ animationDelay: '360ms' }}>
          {instagramDmUrl ? (
            <a href={instagramDmUrl} className={styles.btnPrimary}>
              Book via Instagram DM
            </a>
          ) : (
            <span className={`${styles.btnPrimary} ${styles.btnDisabled}`} aria-disabled="true">
              Instagram DM — coming soon
            </span>
          )}
          <a href={phoneHref} className={styles.btnSecondary}>
            Call / Text {phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  );
}
