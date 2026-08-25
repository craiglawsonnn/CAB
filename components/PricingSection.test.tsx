import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PricingSection from '@/components/PricingSection';
import { siteConfig } from '@/content/site';

const props = {
  packages: siteConfig.packages,
  items: siteConfig.pricing,
};

describe('PricingSection', () => {
  it('renders every pricing item name and price', () => {
    render(<PricingSection {...props} />);
    for (const item of props.items) {
      expect(screen.getByText(item.name)).toBeInTheDocument();
      expect(screen.getByText(item.price)).toBeInTheDocument();
    }
  });

  it('renders every package name, price, and features as text', () => {
    render(<PricingSection {...props} />);
    for (const pkg of props.packages) {
      expect(screen.getByRole('heading', { name: pkg.name })).toBeInTheDocument();
      expect(screen.getByText(pkg.price)).toBeInTheDocument();
      for (const feature of pkg.features) {
        expect(screen.getByText(feature)).toBeInTheDocument();
      }
    }
  });

  it('sets the section id to services', () => {
    render(<PricingSection {...props} />);
    expect(document.getElementById('services')).not.toBeNull();
  });
});
