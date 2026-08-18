import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReelsSection from '@/components/ReelsSection';
import { siteConfig } from '@/content/site';

describe('ReelsSection', () => {
  it('renders one frame per reel', () => {
    render(<ReelsSection reels={siteConfig.reels} />);
    expect(screen.getAllByText('Coming soon')).toHaveLength(siteConfig.reels.length);
  });

  it('sets the section id to social-showcase', () => {
    render(<ReelsSection reels={siteConfig.reels} />);
    expect(document.getElementById('social-showcase')).not.toBeNull();
  });
});
