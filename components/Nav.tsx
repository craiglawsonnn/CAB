'use client';

import { useEffect, useState } from 'react';
import type { NavLink } from '@/content/site';
import styles from './Nav.module.css';

export interface NavProps {
  phoneDisplay: string;
  phoneHref: string;
  instagramDmUrl: string | null;
  instagramPendingLabel: string;
  logoSrc: string;
  businessName: string;
  links: NavLink[];
  callButtonLabel: string;
  instagramButtonLabel: string;
}

export default function Nav({
  phoneDisplay,
  phoneHref,
  instagramDmUrl,
  instagramPendingLabel,
  logoSrc,
  businessName,
  links,
  callButtonLabel,
  instagramButtonLabel,
}: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
        <button
          type="button"
          className={`${styles.menuToggle} ${menuOpen ? styles.menuToggleOpen : ''}`}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav
          id="primary-navigation"
          className={`${styles.links} ${menuOpen ? styles.linksOpen : ''}`}
        >
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className={styles.cta}>
          <a href={phoneHref} className={styles.btnOutline}>
            {callButtonLabel}
          </a>
          {instagramDmUrl ? (
            <a href={instagramDmUrl} className={styles.btnAccent}>
              {instagramButtonLabel}
            </a>
          ) : (
            <span className={`${styles.btnAccent} ${styles.btnDisabled}`} aria-disabled="true">
              {instagramPendingLabel}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
