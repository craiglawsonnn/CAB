import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Nav from '@/components/Nav';

const props = {
  phoneDisplay: '(406) 609-5321',
  phoneHref: 'tel:+14066095321',
  instagramDmUrl: 'https://instagram.com/direct/inbox/',
  logoSrc: '/images/logo.jpg',
  businessName: 'CAB Premium Detailing',
};

describe('Nav', () => {
  it('renders a Call Now link using the phoneHref prop', () => {
    render(<Nav {...props} />);
    expect(screen.getByRole('link', { name: 'Call Now' })).toHaveAttribute(
      'href',
      props.phoneHref
    );
  });

  it('renders a DM on Instagram link using the instagramDmUrl prop', () => {
    render(<Nav {...props} />);
    expect(screen.getByRole('link', { name: 'DM on Instagram' })).toHaveAttribute(
      'href',
      props.instagramDmUrl
    );
  });

  it('renders all five anchor nav links', () => {
    render(<Nav {...props} />);
    const expected = ['Services', 'Before & After', 'Reels', 'Reviews', 'Contact'];
    for (const label of expected) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('renders the logo with the business name as alt text', () => {
    render(<Nav {...props} />);
    expect(screen.getByAltText(`${props.businessName} logo`)).toHaveAttribute(
      'src',
      props.logoSrc
    );
  });
});
