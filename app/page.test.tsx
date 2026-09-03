import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import { siteConfig } from '@/content/site';

describe('Home page composition', () => {
  it('renders all major sections with their anchor ids', () => {
    render(<Home />);
    expect(document.getElementById('hero')).not.toBeNull();
    expect(document.getElementById('portfolio')).not.toBeNull();
    expect(document.getElementById('gallery')).not.toBeNull();
    expect(document.getElementById('social-showcase')).not.toBeNull();
    expect(document.getElementById('reviews')).not.toBeNull();
    expect(document.getElementById('services')).not.toBeNull();
    expect(document.getElementById('contact')).not.toBeNull();
  });

  it('renders one slider per configured before/after pair', () => {
    render(<Home />);
    expect(screen.getAllByRole('slider')).toHaveLength(siteConfig.beforeAfter.pairs.length);
  });

  it('renders the Call Now nav link with the configured tel href', () => {
    render(<Home />);
    expect(screen.getByRole('link', { name: siteConfig.nav.callButtonLabel })).toHaveAttribute(
      'href',
      siteConfig.phoneHref
    );
  });

  it('renders every section heading from its correct configured field', () => {
    render(<Home />);
    const headings = [
      siteConfig.beforeAfter.heading,
      siteConfig.gallery.heading,
      siteConfig.reels.heading,
      siteConfig.pricing.heading,
      siteConfig.contact.heading,
      siteConfig.googleReview.heading,
    ];
    for (const heading of headings) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    }
  });
});
