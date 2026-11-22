import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AircraftSection from '@/components/AircraftSection';
import { siteConfig } from '@/content/site';

const baseProps = {
  content: siteConfig.aircraft,
  instagramDmUrl: 'https://ig.me/m/cab.premiumdetailing',
  instagramPendingLabel: 'Instagram DM — coming soon',
  phoneDisplay: '(406) 609-5321',
  phoneHref: 'tel:+14066095321',
};

describe('AircraftSection', () => {
  it('renders the section heading, intro copy and pull quote', () => {
    render(<AircraftSection {...baseProps} />);
    expect(document.getElementById('aircraft')).not.toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: siteConfig.aircraft.heading })).toBeInTheDocument();
    for (const paragraph of siteConfig.aircraft.intro) {
      expect(screen.getByText(paragraph)).toBeInTheDocument();
    }
    expect(screen.getByText(siteConfig.aircraft.pullQuote)).toBeInTheDocument();
  });

  it('renders the Cessna 150 package with its price and every included item', () => {
    render(<AircraftSection {...baseProps} />);
    const { featured } = siteConfig.aircraft;
    expect(screen.getByRole('heading', { name: featured.name })).toBeInTheDocument();
    expect(screen.getByText(featured.price)).toBeInTheDocument();
    for (const item of featured.items) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
    expect(screen.getByText(featured.footnote)).toBeInTheDocument();
  });

  it('renders every aircraft photo with alt text', () => {
    render(<AircraftSection {...baseProps} />);
    for (const photo of siteConfig.aircraft.photos) {
      expect(screen.getByAltText(photo.alt)).toHaveAttribute('src', photo.src);
    }
  });

  it('links to Instagram DM and phone', () => {
    render(<AircraftSection {...baseProps} />);
    const igLinks = screen.getAllByRole('link', { name: siteConfig.aircraft.instagramButtonLabel });
    const phoneLinks = screen.getAllByRole('link', { name: /\(406\) 609-5321/ });
    expect(igLinks.length).toBeGreaterThan(0);
    expect(phoneLinks.length).toBeGreaterThan(0);
    for (const link of igLinks) expect(link).toHaveAttribute('href', baseProps.instagramDmUrl);
    for (const link of phoneLinks) expect(link).toHaveAttribute('href', baseProps.phoneHref);
  });

  it('shows the pending label when there is no Instagram URL', () => {
    render(<AircraftSection {...baseProps} instagramDmUrl={null} />);
    expect(screen.getByText(baseProps.instagramPendingLabel)).toHaveAttribute('aria-disabled', 'true');
  });
});
