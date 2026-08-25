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
    expect(screen.getAllByRole('slider')).toHaveLength(siteConfig.beforeAfterPairs.length);
  });

  it('renders the Call Now nav link with the configured tel href', () => {
    render(<Home />);
    expect(screen.getByRole('link', { name: 'Call Now' })).toHaveAttribute(
      'href',
      siteConfig.phoneHref
    );
  });
});
