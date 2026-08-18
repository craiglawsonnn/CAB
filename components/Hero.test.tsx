import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Hero from '@/components/Hero';

const props = {
  heroImageSrc: '/images/hero.jpg',
  phoneDisplay: '(406) 609-5321',
  phoneHref: 'tel:+14066095321',
  instagramDmUrl: 'https://instagram.com/direct/inbox/',
};

describe('Hero', () => {
  it('renders the headline', () => {
    render(<Hero {...props} />);
    expect(
      screen.getByRole('heading', { name: /premium detailing for cars, airplanes/i })
    ).toBeInTheDocument();
  });

  it('renders a DM CTA linking to instagramDmUrl', () => {
    render(<Hero {...props} />);
    expect(screen.getByRole('link', { name: /book via instagram dm/i })).toHaveAttribute(
      'href',
      props.instagramDmUrl
    );
  });

  it('renders a call CTA linking to phoneHref and showing phoneDisplay', () => {
    render(<Hero {...props} />);
    const link = screen.getByRole('link', { name: new RegExp(props.phoneDisplay.replace(/[()]/g, '\\$&')) });
    expect(link).toHaveAttribute('href', props.phoneHref);
  });

  it('sets the section id to hero', () => {
    render(<Hero {...props} />);
    expect(document.getElementById('hero')).not.toBeNull();
  });
});
