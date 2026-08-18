'use client';

import { useEffect } from 'react';
import type { ReelItem } from '@/content/site';
import { detectPlatform } from '@/lib/reelPlatform';
import styles from './ReelEmbed.module.css';

export interface ReelEmbedProps {
  reel: ReelItem;
}

const EMBED_SCRIPTS: Record<'instagram' | 'tiktok', string> = {
  instagram: 'https://www.instagram.com/embed.js',
  tiktok: 'https://www.tiktok.com/embed.js',
};

export default function ReelEmbed({ reel }: ReelEmbedProps) {
  const platform = reel.embedUrl ? detectPlatform(reel.embedUrl) : null;

  useEffect(() => {
    if (!platform || platform === 'unknown') return;
    const scriptSrc = EMBED_SCRIPTS[platform];
    const existing = document.querySelector(`script[src="${scriptSrc}"]`);
    if (existing) {
      const instgrm = (window as unknown as { instgrm?: { Embeds?: { process?: () => void } } })
        .instgrm;
      instgrm?.Embeds?.process?.();
      return;
    }
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    document.body.appendChild(script);
  }, [platform]);

  if (!reel.embedUrl || !platform) {
    return (
      <div className={styles.placeholder}>
        <span className={styles.playIcon}>▶</span>
        <p>{reel.caption}</p>
        <span className={styles.comingSoon}>Coming soon</span>
      </div>
    );
  }

  if (platform === 'instagram') {
    return (
      <div className={styles.embed}>
        <blockquote className="instagram-media" data-instgrm-permalink={reel.embedUrl} />
      </div>
    );
  }

  if (platform === 'tiktok') {
    return (
      <div className={styles.embed}>
        <blockquote className="tiktok-embed" cite={reel.embedUrl}>
          <a href={reel.embedUrl}>{reel.caption}</a>
        </blockquote>
      </div>
    );
  }

  return (
    <div className={styles.embed}>
      <a href={reel.embedUrl} className={styles.fallbackLink}>
        {reel.caption}
      </a>
    </div>
  );
}
