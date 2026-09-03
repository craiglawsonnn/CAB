// components/ContactSection.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContactSection from '@/components/ContactSection';

const props = {
  instagramDmUrl: 'https://instagram.com/direct/inbox/',
  phoneDisplay: '(406) 609-5321',
  phoneHref: 'tel:+14066095321',
  instagramPendingLabel: 'Instagram DM — coming soon',
  heading: 'Ready to Book Your Detail?',
  body: 'DM us on Instagram or call/text to discuss pricing and schedule your appointment.',
  instagramButtonLabel: 'DM Us on Instagram',
  callButtonPrefix: 'Call / Text ',
};

describe('ContactSection', () => {
  it('renders the configured heading and body', () => {
    render(<ContactSection {...props} />);
    expect(screen.getByRole('heading', { name: props.heading })).toBeInTheDocument();
    expect(screen.getByText(props.body)).toBeInTheDocument();
  });

  it('renders a DM CTA linking to instagramDmUrl', () => {
    render(<ContactSection {...props} />);
    expect(screen.getByRole('link', { name: props.instagramButtonLabel })).toHaveAttribute(
      'href',
      props.instagramDmUrl
    );
  });

  it('renders a call CTA linking to phoneHref and showing the prefix plus phoneDisplay', () => {
    render(<ContactSection {...props} />);
    const link = screen.getByRole('link', {
      name: `${props.callButtonPrefix}${props.phoneDisplay}`,
    });
    expect(link).toHaveAttribute('href', props.phoneHref);
  });

  it('sets the section id to contact', () => {
    render(<ContactSection {...props} />);
    expect(document.getElementById('contact')).not.toBeNull();
  });

  it('renders a disabled pending state when instagramDmUrl is null', () => {
    render(<ContactSection {...props} instagramDmUrl={null} />);
    expect(screen.queryByRole('link', { name: props.instagramButtonLabel })).toBeNull();
    expect(screen.getByText(props.instagramPendingLabel)).toBeInTheDocument();
  });
});
