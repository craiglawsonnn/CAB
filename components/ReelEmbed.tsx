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

// Instagram's embed.js exposes a re-process hook so already-rendered
// blockquotes that were added to the DOM after the script first loaded can
// be picked up. TikTok's embed.js scans the DOM for blockquote.tiktok-embed
// elements itself once it loads and does not expose an equivalent public
// API, so there is nothing additional to trigger for that platform.
function processEmbeds(platform: 'instagram' | 'tiktok') {
  if (platform === 'instagram') {
    const instgrm = (window as unknown as { instgrm?: { Embeds?: { process?: () => void } } })
      .instgrm;
    instgrm?.Embeds?.process?.();
  }
}

export default function ReelEmbed({ reel }: ReelEmbedProps) {
  const platform = reel.embedUrl ? detectPlatform(reel.embedUrl) : null;

  useEffect(() => {
    if (!platform || platform === 'unknown') return;
    const scriptSrc = EMBED_SCRIPTS[platform];
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${scriptSrc}"]`);

    if (existing) {
      // A previous ReelEmbed instance for this platform already appended
      // the script. If it has finished loading, the platform's global is
      // ready and we can process this instance's blockquote right away.
      // If it hasn't finished loading yet (the script tag is `async`, so
      // there is no guarantee it has executed by the time this effect
      // runs), calling process() now would silently no-op because the
      // platform global doesn't exist yet — instead we wait for the
      // script's `load` event so every mounted instance eventually gets
      // processed regardless of mount order.
      if (existing.dataset.loaded === 'true') {
        processEmbeds(platform);
        return;
      }
      const handleLoad = () => processEmbeds(platform);
      existing.addEventListener('load', handleLoad, { once: true });
      return () => existing.removeEventListener('load', handleLoad);
    }

    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    script.dataset.loaded = 'false';
    const handleLoad = () => {
      script.dataset.loaded = 'true';
      processEmbeds(platform);
    };
    script.addEventListener('load', handleLoad, { once: true });
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
