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

  it('has exactly four add-on pricing items', () => {
    expect(siteConfig.pricing).toHaveLength(4);
  });

  it('has exactly two packages, each with at least one checklist of at least one item', () => {
    expect(siteConfig.packages).toHaveLength(2);
    for (const pkg of siteConfig.packages) {
      expect(pkg.checklists.length).toBeGreaterThan(0);
      for (const checklist of pkg.checklists) {
        expect(checklist.items.length).toBeGreaterThan(0);
      }
    }
  });

  it('corrects the pre-wash step to plain "Pre-wash" (not "Two-step pre-wash")', () => {
    const refresh = siteConfig.packages.find((pkg) => pkg.id === 'refresh');
    const exterior = refresh?.checklists.find((c) => c.heading.startsWith('EXTERIOR'));
    expect(exterior?.items).toContain('Pre-wash');
    expect(exterior?.items).not.toContain('Two-step pre-wash');
  });

  it('has exactly four standalone options', () => {
    expect(siteConfig.standaloneOptions).toHaveLength(4);
  });

  it('has exactly two quote-based services, each with at least one pricing factor', () => {
    expect(siteConfig.quoteServices).toHaveLength(2);
    for (const service of siteConfig.quoteServices) {
      expect(service.factors.length).toBeGreaterThan(0);
    }
  });

  it('references gallery images that exist on disk', () => {
    expect(siteConfig.gallery.length).toBeGreaterThan(0);
    for (const image of siteConfig.gallery) {
      assertImageExists(image.src);
    }
  });

  it('references a logo and hero image that exist on disk', () => {
    assertImageExists(siteConfig.logoSrc);
    assertImageExists(siteConfig.heroImageSrc);
  });

  it('uses the confirmed Google Business Profile url', () => {
    expect(siteConfig.googleReview.profileUrl).toBe(
      'https://maps.app.goo.gl/HFcJiYVWfW2wRLeA9?g_st=ii'
    );
  });

  it('has a real Instagram reel url for every reel', () => {
    for (const reel of siteConfig.reels) {
      expect(reel.embedUrl).toMatch(/^https:\/\/www\.instagram\.com\/reel\//);
    }
  });

  it('uses the confirmed Instagram DM url', () => {
    expect(siteConfig.instagramDmUrl).toBe('https://ig.me/m/cab.premiumdetailing');
  });
});
