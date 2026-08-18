import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PricingSection from '@/components/PricingSection';
import { siteConfig } from '@/content/site';

const props = {
  items: siteConfig.pricing,
  addonsImageSrc: siteConfig.pricingImages.addons,
  pricesImageSrc: siteConfig.pricingImages.prices,
  headlightImageSrc: siteConfig.pricingImages.headlight,
  detailsImageSrc: siteConfig.pricingImages.details,
};

describe('PricingSection', () => {
  it('renders every pricing item name and price', () => {
    render(<PricingSection {...props} />);
    for (const item of props.items) {
      expect(screen.getByText(item.name)).toBeInTheDocument();
      expect(screen.getByText(item.price)).toBeInTheDocument();
    }
  });

  it('renders the four supporting images', () => {
    render(<PricingSection {...props} />);
    expect(screen.getByRole('img', { name: /add-on services/i })).toHaveAttribute(
      'src',
      props.addonsImageSrc
    );
    expect(screen.getByRole('img', { name: /pricing reference/i })).toHaveAttribute(
      'src',
      props.pricesImageSrc
    );
    expect(screen.getByRole('img', { name: /headlight restoration/i })).toHaveAttribute(
      'src',
      props.headlightImageSrc
    );
    expect(screen.getByRole('img', { name: /detailing close-up/i })).toHaveAttribute(
      'src',
      props.detailsImageSrc
    );
  });

  it('sets the section id to services', () => {
    render(<PricingSection {...props} />);
    expect(document.getElementById('services')).not.toBeNull();
  });
});
