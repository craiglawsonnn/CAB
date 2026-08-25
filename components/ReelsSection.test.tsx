import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReelsSection from '@/components/ReelsSection';
import { siteConfig } from '@/content/site';

describe('ReelsSection', () => {
  it('renders one embedded blockquote per reel, linked to its real Instagram url', () => {
    render(<ReelsSection reels={siteConfig.reels} />);
    for (const reel of siteConfig.reels) {
      expect(
        document.querySelector(`blockquote[data-instgrm-permalink="${reel.embedUrl}"]`)
      ).not.toBeNull();
    }
  });

  it('sets the section id to social-showcase', () => {
    render(<ReelsSection reels={siteConfig.reels} />);
    expect(document.getElementById('social-showcase')).not.toBeNull();
  });
});
