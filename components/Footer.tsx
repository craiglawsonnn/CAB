import styles from './Footer.module.css';

export interface FooterProps {
  logoSrc: string;
  businessName: string;
  instagramDmUrl: string | null;
  googleProfileUrl: string | null;
  instagramPendingLabel: string;
  copyrightSuffix: string;
  instagramLabel: string;
  googleLabel: string;
}

export default function Footer({
  logoSrc,
  businessName,
  instagramDmUrl,
  googleProfileUrl,
  instagramPendingLabel,
  copyrightSuffix,
  instagramLabel,
  googleLabel,
}: FooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <img src={logoSrc} alt={`${businessName} logo`} className={styles.logo} />
        <p>
          © {year} {businessName}. {copyrightSuffix}
        </p>
        <div className={styles.social}>
          {instagramDmUrl ? (
            <a href={instagramDmUrl}>{instagramLabel}</a>
          ) : (
            <span className={styles.disabled} aria-disabled="true">
              {instagramPendingLabel}
            </span>
          )}
          {googleProfileUrl && <a href={googleProfileUrl}>{googleLabel}</a>}
        </div>
      </div>
    </footer>
  );
}
