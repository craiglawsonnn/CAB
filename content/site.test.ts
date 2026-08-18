import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { siteConfig } from '@/content/site';

const PUBLIC_DIR = path.resolve('public');

function assertImageExists(publicPath: string) {
  const diskPath = path.join(PUBLIC_DIR, publicPath.replace(/^\//, ''));
  expect(existsSync(diskPath), `expected image at ${diskPath}`).toBe(true);
}

describe('siteConfig', () => {
  it('uses the real confirmed phone number', () => {
    expect(siteConfig.phoneDisplay).toBe('(406) 609-5321');
    expect(siteConfig.phoneHref).toBe('tel:+14066095321');
  });

  it('has exactly six before/after pairs, each with images on disk', () => {
    expect(siteConfig.beforeAfterPairs).toHaveLength(6);
    for (const pair of siteConfig.beforeAfterPairs) {
      assertImageExists(pair.beforeSrc);
      assertImageExists(pair.afterSrc);
    }
  });

  it('has exactly four pricing items', () => {
    expect(siteConfig.pricing).toHaveLength(4);
  });

  it('references pricing support images that exist on disk', () => {
    assertImageExists(siteConfig.pricingImages.addons);
    assertImageExists(siteConfig.pricingImages.prices);
    assertImageExists(siteConfig.pricingImages.headlight);
    assertImageExists(siteConfig.pricingImages.details);
  });

  it('references a logo and hero image that exist on disk', () => {
    assertImageExists(siteConfig.logoSrc);
    assertImageExists(siteConfig.heroImageSrc);
  });

  it('does not fabricate a Google review profile url', () => {
    expect(siteConfig.googleReview.profileUrl).toBeNull();
  });

  it('does not fabricate reel embed urls', () => {
    for (const reel of siteConfig.reels) {
      expect(reel.embedUrl).toBeNull();
    }
  });
});
