import styles from './ContactSection.module.css';

export interface ContactSectionProps {
  instagramDmUrl: string | null;
  phoneDisplay: string;
  phoneHref: string;
  instagramPendingLabel: string;
  heading: string;
  body: string;
  instagramButtonLabel: string;
  callButtonPrefix: string;
}

export default function ContactSection({
  instagramDmUrl,
  phoneDisplay,
  phoneHref,
  instagramPendingLabel,
  heading,
  body,
  instagramButtonLabel,
  callButtonPrefix,
}: ContactSectionProps) {
  return (
    <section id="contact" className={styles.section}>
      <div className={styles.inner}>
        <h2>{heading}</h2>
        <p>{body}</p>
        <div className={styles.actions}>
          {instagramDmUrl ? (
            <a href={instagramDmUrl} className={styles.btnInstagram}>
              {instagramButtonLabel}
            </a>
          ) : (
            <span className={`${styles.btnInstagram} ${styles.btnDisabled}`} aria-disabled="true">
              {instagramPendingLabel}
            </span>
          )}
          <a href={phoneHref} className={styles.btnPhone}>
            {callButtonPrefix}
            {phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  );
}
