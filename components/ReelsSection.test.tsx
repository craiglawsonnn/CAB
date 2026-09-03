import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReelsSection from '@/components/ReelsSection';
import { siteConfig } from '@/content/site';

describe('ReelsSection', () => {
  it('renders one embedded blockquote per reel, linked to its real Instagram url', () => {
    render(
      <ReelsSection
        reels={siteConfig.reels.items}
        heading={siteConfig.reels.heading}
        subtitle={siteConfig.reels.subtitle}
        comingSoonLabel={siteConfig.reels.comingSoonLabel}
      />
    );
    for (const reel of siteConfig.reels.items) {
      expect(
        document.querySelector(`blockquote[data-instgrm-permalink="${reel.embedUrl}"]`)
      ).not.toBeNull();
    }
  });

  it('renders the configured heading and subtitle', () => {
    render(
      <ReelsSection
        reels={siteConfig.reels.items}
        heading={siteConfig.reels.heading}
        subtitle={siteConfig.reels.subtitle}
        comingSoonLabel={siteConfig.reels.comingSoonLabel}
      />
    );
    expect(screen.getByRole('heading', { name: siteConfig.reels.heading })).toBeInTheDocument();
    expect(screen.getByText(siteConfig.reels.subtitle)).toBeInTheDocument();
  });

  it('sets the section id to social-showcase', () => {
    render(
      <ReelsSection
        reels={siteConfig.reels.items}
        heading={siteConfig.reels.heading}
        subtitle={siteConfig.reels.subtitle}
        comingSoonLabel={siteConfig.reels.comingSoonLabel}
      />
    );
    expect(document.getElementById('social-showcase')).not.toBeNull();
  });
});
