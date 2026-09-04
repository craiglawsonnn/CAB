'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SiteConfig } from '@/content/site';
import SaveBar from '@/components/admin/SaveBar';
import BasicsSection, { type BasicsFields } from './sections/BasicsSection';
import NavSection from './sections/NavSection';
import HeroSection from './sections/HeroSection';
import ReelsSection from './sections/ReelsSection';
import ReviewsSection from './sections/ReviewsSection';
import ContactSection from './sections/ContactSection';
import FooterSection from './sections/FooterSection';
import LogoutButton from './LogoutButton';
import styles from './AdminDashboard.module.css';

export interface AdminDashboardProps {
  initialContent: SiteConfig;
}

export default function AdminDashboard({ initialContent }: AdminDashboardProps) {
  const [content, setContent] = useState<SiteConfig>(initialContent);
  const [dirty, setDirty] = useState(false);

  const updateContent = useCallback((patch: Partial<SiteConfig>) => {
    setContent((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  const basicsFields: BasicsFields = {
    businessName: content.businessName,
    phoneDisplay: content.phoneDisplay,
    phoneHref: content.phoneHref,
    instagramDmUrl: content.instagramDmUrl,
    instagramPendingLabel: content.instagramPendingLabel,
    seoTitle: content.seo.title,
    seoDescription: content.seo.description,
  };

  const handleBasicsChange = (fields: BasicsFields) => {
    updateContent({
      businessName: fields.businessName,
      phoneDisplay: fields.phoneDisplay,
      phoneHref: fields.phoneHref,
      instagramDmUrl: fields.instagramDmUrl,
      instagramPendingLabel: fields.instagramPendingLabel,
      seo: { title: fields.seoTitle, description: fields.seoDescription },
    });
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1>Admin Dashboard</h1>
        <LogoutButton />
      </div>
      <SaveBar content={content} onSaved={() => setDirty(false)} />
      <BasicsSection fields={basicsFields} onChange={handleBasicsChange} />
      <NavSection content={content.nav} onChange={(nav) => updateContent({ nav })} />
      <HeroSection content={content.hero} onChange={(hero) => updateContent({ hero })} />
      <ReelsSection content={content.reels} onChange={(reels) => updateContent({ reels })} />
      <ReviewsSection
        content={content.googleReview}
        onChange={(googleReview) => updateContent({ googleReview })}
      />
      <ContactSection content={content.contact} onChange={(contact) => updateContent({ contact })} />
      <FooterSection content={content.footer} onChange={(footer) => updateContent({ footer })} />
    </main>
  );
}
