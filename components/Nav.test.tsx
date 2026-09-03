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
  links: [
    { href: '#services', label: 'Services' },
    { href: '#portfolio', label: 'Before & After' },
    { href: '#gallery', label: 'Gallery' },
    { href: '#social-showcase', label: 'Reels' },
    { href: '#reviews', label: 'Reviews' },
    { href: '#contact', label: 'Contact' },
  ],
  callButtonLabel: 'Call Now',
  instagramButtonLabel: 'DM on Instagram',
  instagramPendingLabel: 'Instagram DM — coming soon',
};

describe('Nav', () => {
  it('renders a Call Now link using the phoneHref prop', () => {
    render(<Nav {...props} />);
    expect(screen.getByRole('link', { name: props.callButtonLabel })).toHaveAttribute(
      'href',
      props.phoneHref
    );
  });

  it('renders a DM on Instagram link using the instagramDmUrl prop', () => {
    render(<Nav {...props} />);
    expect(screen.getByRole('link', { name: props.instagramButtonLabel })).toHaveAttribute(
      'href',
      props.instagramDmUrl
    );
  });

  it('renders every configured nav link', () => {
    render(<Nav {...props} />);
    for (const link of props.links) {
      expect(screen.getByRole('link', { name: link.label })).toHaveAttribute('href', link.href);
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
    expect(screen.queryByRole('link', { name: props.instagramButtonLabel })).toBeNull();
    expect(screen.getByText(props.instagramPendingLabel)).toBeInTheDocument();
  });
});
