'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SiteConfig } from '@/content/site';
import SaveBar from '@/components/admin/SaveBar';
import BasicsSection, { type BasicsFields } from './sections/BasicsSection';
import SiteImagesSection from './sections/SiteImagesSection';
import NavSection from './sections/NavSection';
import HeroSection from './sections/HeroSection';
import BeforeAfterSection from './sections/BeforeAfterSection';
import GallerySection from './sections/GallerySection';
import ReelsSection from './sections/ReelsSection';
import ReviewsSection from './sections/ReviewsSection';
import ContactSection from './sections/ContactSection';
import FooterSection from './sections/FooterSection';
import LogoutButton from './LogoutButton';
import styles from './AdminDashboard.module.css';

export interface AdminDashboardProps {
  initialContent: SiteConfig;
}

function getPublishedPaths(config: SiteConfig): Set<string> {
  return new Set<string>([
    config.logoSrc,
    config.heroImageSrc,
    ...config.gallery.images.map((image) => image.src),
    ...config.beforeAfter.pairs.flatMap((pair) => [pair.beforeSrc, pair.afterSrc]),
  ]);
}

export default function AdminDashboard({ initialContent }: AdminDashboardProps) {
  const [content, setContent] = useState<SiteConfig>(initialContent);
  const [dirty, setDirty] = useState(false);
  const [pendingImages, setPendingImages] = useState<Record<string, File>>({});
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
  const publishedPaths = useMemo(() => getPublishedPaths(initialContent), [initialContent]);

  const updateContent = useCallback((patch: Partial<SiteConfig>) => {
    setContent((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }, []);

  const registerImage = useCallback((path: string, file: File) => {
    setPendingImages((prev) => ({ ...prev, [path]: file }));
    setPendingDeletes((prev) => {
      if (!prev.has(path)) return prev;
      const next = new Set(prev);
      next.delete(path);
      return next;
    });
    setDirty(true);
  }, []);

  const removeImage = useCallback(
    (path: string) => {
      setPendingImages((prev) => {
        const next = { ...prev };
        delete next[path];
        return next;
      });
      if (publishedPaths.has(path)) {
        setPendingDeletes((prev) => new Set(prev).add(path));
      }
      setDirty(true);
    },
    [publishedPaths]
  );

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

  const handleSaved = () => {
    setDirty(false);
    setPendingImages({});
    setPendingDeletes(new Set());
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1>Admin Dashboard</h1>
        <LogoutButton />
      </div>
      <SaveBar
        content={content}
        publishedPaths={publishedPaths}
        pendingImages={pendingImages}
        pendingDeletes={Array.from(pendingDeletes)}
        onSaved={handleSaved}
      />
      <BasicsSection fields={basicsFields} onChange={handleBasicsChange} />
      <SiteImagesSection
        logoSrc={content.logoSrc}
        heroImageSrc={content.heroImageSrc}
        onImageSelected={registerImage}
      />
      <NavSection content={content.nav} onChange={(nav) => updateContent({ nav })} />
      <HeroSection content={content.hero} onChange={(hero) => updateContent({ hero })} />
      <BeforeAfterSection
        content={content.beforeAfter}
        onChange={(beforeAfter) => updateContent({ beforeAfter })}
        onImageSelected={registerImage}
        onImageRemoved={removeImage}
      />
      <GallerySection
        content={content.gallery}
        onChange={(gallery) => updateContent({ gallery })}
        onImageSelected={registerImage}
        onImageRemoved={removeImage}
      />
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
