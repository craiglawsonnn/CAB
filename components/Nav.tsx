'use client';

import { useEffect, useState } from 'react';
import styles from './Nav.module.css';

export interface NavProps {
  phoneDisplay: string;
  phoneHref: string;
  instagramDmUrl: string | null;
  logoSrc: string;
  businessName: string;
}

const NAV_LINKS = [
  { href: '#services', label: 'Services' },
  { href: '#portfolio', label: 'Before & After' },
  { href: '#social-showcase', label: 'Reels' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#contact', label: 'Contact' },
];

export default function Nav({
  phoneDisplay,
  phoneHref,
  instagramDmUrl,
  logoSrc,
  businessName,
}: NavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <a href="#hero" className={styles.brand}>
          <img src={logoSrc} alt={`${businessName} logo`} className={styles.logo} />
        </a>
        <nav className={styles.links}>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className={styles.cta}>
          <a href={phoneHref} className={styles.btnOutline}>
            Call Now
          </a>
          {instagramDmUrl ? (
            <a href={instagramDmUrl} className={styles.btnAccent}>
              DM on Instagram
            </a>
          ) : (
            <span className={`${styles.btnAccent} ${styles.btnDisabled}`} aria-disabled="true">
              Instagram DM — coming soon
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
