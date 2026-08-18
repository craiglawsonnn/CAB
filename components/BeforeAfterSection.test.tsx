import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BeforeAfterSection from '@/components/BeforeAfterSection';
import { siteConfig } from '@/content/site';

describe('BeforeAfterSection', () => {
  it('renders one slider per pair', () => {
    render(<BeforeAfterSection pairs={siteConfig.beforeAfterPairs} />);
    expect(screen.getAllByRole('slider')).toHaveLength(siteConfig.beforeAfterPairs.length);
  });

  it('sets the section id to portfolio', () => {
    render(<BeforeAfterSection pairs={siteConfig.beforeAfterPairs} />);
    expect(document.getElementById('portfolio')).not.toBeNull();
  });

  it('renders every pair caption', () => {
    render(<BeforeAfterSection pairs={siteConfig.beforeAfterPairs} />);
    for (const pair of siteConfig.beforeAfterPairs) {
      expect(screen.getByText(pair.caption)).toBeInTheDocument();
    }
  });
});
