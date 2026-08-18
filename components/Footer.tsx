import styles from './Footer.module.css';

export interface FooterProps {
  logoSrc: string;
  businessName: string;
  instagramDmUrl: string;
  googleProfileUrl: string | null;
}

export default function Footer({
  logoSrc,
  businessName,
  instagramDmUrl,
  googleProfileUrl,
}: FooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <img src={logoSrc} alt={`${businessName} logo`} className={styles.logo} />
        <p>
          © {year} {businessName}. All rights reserved.
        </p>
        <div className={styles.social}>
          <a href={instagramDmUrl}>Instagram</a>
          {googleProfileUrl && <a href={googleProfileUrl}>Google Page</a>}
        </div>
      </div>
    </footer>
  );
}
