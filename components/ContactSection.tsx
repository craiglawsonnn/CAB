import styles from './ContactSection.module.css';

export interface ContactSectionProps {
  instagramDmUrl: string | null;
  phoneDisplay: string;
  phoneHref: string;
}

export default function ContactSection({
  instagramDmUrl,
  phoneDisplay,
  phoneHref,
}: ContactSectionProps) {
  return (
    <section id="contact" className={styles.section}>
      <div className={styles.inner}>
        <h2>Ready to Book Your Detail?</h2>
        <p>DM us on Instagram or call/text to discuss pricing and schedule your appointment.</p>
        <div className={styles.actions}>
          {instagramDmUrl ? (
            <a href={instagramDmUrl} className={styles.btnInstagram}>
              DM Us on Instagram
            </a>
          ) : (
            <span className={`${styles.btnInstagram} ${styles.btnDisabled}`} aria-disabled="true">
              Instagram DM — coming soon
            </span>
          )}
          <a href={phoneHref} className={styles.btnPhone}>
            Call / Text {phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  );
}
