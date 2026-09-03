import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PricingSection from '@/components/PricingSection';
import { siteConfig } from '@/content/site';

const props = {
  packages: siteConfig.pricing.packages,
  standaloneOptions: siteConfig.pricing.standaloneOptions,
  quoteServices: siteConfig.pricing.quoteServices,
  items: siteConfig.pricing.addons,
};

describe('PricingSection', () => {
  it('renders every add-on item name and price', () => {
    render(<PricingSection {...props} />);
    for (const item of props.items) {
      expect(screen.getByText(item.name)).toBeInTheDocument();
      expect(screen.getByText(item.price)).toBeInTheDocument();
    }
  });

  it('renders every package name, price, and checklist items as text', () => {
    render(<PricingSection {...props} />);
    for (const pkg of props.packages) {
      expect(screen.getByRole('heading', { name: pkg.name })).toBeInTheDocument();
      expect(screen.getAllByText(pkg.price).length).toBeGreaterThan(0);
      for (const checklist of pkg.checklists) {
        expect(screen.getByText(checklist.heading)).toBeInTheDocument();
        for (const item of checklist.items) {
          expect(screen.getAllByText(item).length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('renders a booking link for every package that points at #contact', () => {
    render(<PricingSection {...props} />);
    for (const pkg of props.packages) {
      const link = screen.getByRole('link', { name: pkg.ctaLabel });
      expect(link).toHaveAttribute('href', '#contact');
    }
  });

  it('renders every standalone option name and price', () => {
    render(<PricingSection {...props} />);
    for (const option of props.standaloneOptions) {
      expect(screen.getByText(option.name)).toBeInTheDocument();
      expect(screen.getAllByText(option.price).length).toBeGreaterThan(0);
    }
  });

  it('renders every quote service name, starting price, and pricing factors', () => {
    render(<PricingSection {...props} />);
    for (const service of props.quoteServices) {
      expect(screen.getByRole('heading', { name: service.name })).toBeInTheDocument();
      expect(screen.getByText(service.startingPrice)).toBeInTheDocument();
      for (const factor of service.factors) {
        expect(screen.getAllByText(factor).length).toBeGreaterThan(0);
      }
    }
  });

  it('sets the section id to services', () => {
    render(<PricingSection {...props} />);
    expect(document.getElementById('services')).not.toBeNull();
  });
});
