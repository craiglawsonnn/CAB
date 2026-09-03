import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PricingSection from '@/components/PricingSection';
import { siteConfig } from '@/content/site';

const props = {
  packages: siteConfig.pricing.packages,
  standaloneOptions: siteConfig.pricing.standaloneOptions,
  quoteServices: siteConfig.pricing.quoteServices,
  items: siteConfig.pricing.addons,
  heading: siteConfig.pricing.heading,
  subtitle: siteConfig.pricing.subtitle,
  standaloneHeading: siteConfig.pricing.standaloneHeading,
  standaloneSubtitle: siteConfig.pricing.standaloneSubtitle,
  standaloneCaveat: siteConfig.pricing.standaloneCaveat,
  quoteHeading: siteConfig.pricing.quoteHeading,
  quoteSubtitle: siteConfig.pricing.quoteSubtitle,
  quoteFactorsLabel: siteConfig.pricing.quoteFactorsLabel,
  addonsHeading: siteConfig.pricing.addonsHeading,
  addonsSubtitle: siteConfig.pricing.addonsSubtitle,
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

  it('renders the standalone pricing caveat', () => {
    render(<PricingSection {...props} />);
    expect(screen.getAllByText(props.standaloneCaveat).length).toBeGreaterThan(0);
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

  it('renders all configured headings and subtitles', () => {
    render(<PricingSection {...props} />);
    expect(screen.getByRole('heading', { name: props.heading })).toBeInTheDocument();
    expect(screen.getByText(props.subtitle)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: props.standaloneHeading })).toBeInTheDocument();
    expect(screen.getByText(props.standaloneSubtitle)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: props.quoteHeading })).toBeInTheDocument();
    expect(screen.getByText(props.quoteSubtitle)).toBeInTheDocument();
    expect(screen.getAllByText(props.quoteFactorsLabel).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: props.addonsHeading })).toBeInTheDocument();
    expect(screen.getByText(props.addonsSubtitle)).toBeInTheDocument();
  });

  it('sets the section id to services', () => {
    render(<PricingSection {...props} />);
    expect(document.getElementById('services')).not.toBeNull();
  });
});
