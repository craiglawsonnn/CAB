// components/ContactSection.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContactSection from '@/components/ContactSection';

const props = {
  instagramDmUrl: 'https://instagram.com/direct/inbox/',
  phoneDisplay: '(406) 609-5321',
  phoneHref: 'tel:+14066095321',
};

describe('ContactSection', () => {
  it('renders a DM CTA linking to instagramDmUrl', () => {
    render(<ContactSection {...props} />);
    expect(screen.getByRole('link', { name: /dm us on instagram/i })).toHaveAttribute(
      'href',
      props.instagramDmUrl
    );
  });

  it('renders a call CTA linking to phoneHref and showing phoneDisplay', () => {
    render(<ContactSection {...props} />);
    const link = screen.getByRole('link', {
      name: new RegExp(props.phoneDisplay.replace(/[()]/g, '\\$&')),
    });
    expect(link).toHaveAttribute('href', props.phoneHref);
  });

  it('sets the section id to contact', () => {
    render(<ContactSection {...props} />);
    expect(document.getElementById('contact')).not.toBeNull();
  });

  it('renders a disabled pending state when instagramDmUrl is null', () => {
    render(<ContactSection {...props} instagramDmUrl={null} />);
    expect(screen.queryByRole('link', { name: /dm us on instagram/i })).toBeNull();
    expect(screen.getByText('Instagram DM — coming soon')).toBeInTheDocument();
  });
});
