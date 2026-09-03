import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Hero from '@/components/Hero';

const props = {
  heroImageSrc: '/images/hero.jpg',
  phoneDisplay: '(406) 609-5321',
  phoneHref: 'tel:+14066095321',
  instagramDmUrl: 'https://instagram.com/direct/inbox/',
  instagramPendingLabel: 'Instagram DM — coming soon',
  badge: 'Mobile & Premium Service',
  headline: 'Premium Detailing for Cars, Airplanes & Boats',
  subtitle: 'Mobile service. Unmatched quality. Restoring high-end vehicles to showroom perfection.',
  instagramButtonLabel: 'Book via Instagram DM',
  callButtonPrefix: 'Call / Text ',
};

describe('Hero', () => {
  it('renders the headline', () => {
    render(<Hero {...props} />);
    expect(screen.getByRole('heading', { name: props.headline })).toBeInTheDocument();
  });

  it('renders a DM CTA linking to instagramDmUrl', () => {
    render(<Hero {...props} />);
    expect(screen.getByRole('link', { name: props.instagramButtonLabel })).toHaveAttribute(
      'href',
      props.instagramDmUrl
    );
  });

  it('renders a call CTA linking to phoneHref and showing the prefix plus phoneDisplay', () => {
    render(<Hero {...props} />);
    const link = screen.getByRole('link', {
      name: `${props.callButtonPrefix}${props.phoneDisplay}`,
    });
    expect(link).toHaveAttribute('href', props.phoneHref);
  });

  it('sets the section id to hero', () => {
    render(<Hero {...props} />);
    expect(document.getElementById('hero')).not.toBeNull();
  });

  it('renders a disabled pending state when instagramDmUrl is null', () => {
    render(<Hero {...props} instagramDmUrl={null} />);
    expect(screen.queryByRole('link', { name: props.instagramButtonLabel })).toBeNull();
    expect(screen.getByText(props.instagramPendingLabel)).toBeInTheDocument();
  });
});
