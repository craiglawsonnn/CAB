import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('renders all six anchor nav links', () => {
    render(<Nav {...props} />);
    const expected = ['Services', 'Before & After', 'Gallery', 'Reels', 'Reviews', 'Contact'];
    for (const label of expected) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('toggles the mobile menu open and closed via the hamburger button', async () => {
    const user = userEvent.setup();
    render(<Nav {...props} />);
    const toggle = screen.getByRole('button', { name: 'Open menu' });
    const nav = screen.getByRole('navigation');

    expect(nav).not.toHaveClass('linksOpen');

    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
    expect(nav.className).toMatch(/linksOpen/);

    await user.click(screen.getByRole('link', { name: 'Contact' }));
    expect(nav.className).not.toMatch(/linksOpen/);
  });

  it('renders the logo with the business name as alt text', () => {
    render(<Nav {...props} />);
    expect(screen.getByAltText(`${props.businessName} logo`)).toHaveAttribute(
      'src',
      props.logoSrc
    );
  });

  it('renders a disabled pending state when instagramDmUrl is null', () => {
    render(<Nav {...props} instagramDmUrl={null} />);
    expect(screen.queryByRole('link', { name: 'DM on Instagram' })).toBeNull();
    expect(screen.getByText('Instagram DM — coming soon')).toBeInTheDocument();
  });
});
