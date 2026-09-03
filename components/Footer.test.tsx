// components/Footer.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';

const baseProps = {
  logoSrc: '/images/logo.jpg',
  businessName: 'CAB Premium Detailing',
  instagramDmUrl: 'https://instagram.com/direct/inbox/',
  instagramPendingLabel: 'Instagram DM — coming soon',
  copyrightSuffix: 'All rights reserved.',
  instagramLabel: 'Instagram',
  googleLabel: 'Google Page',
};

describe('Footer', () => {
  it('renders an Instagram link using instagramDmUrl', () => {
    render(<Footer {...baseProps} googleProfileUrl={null} />);
    expect(screen.getByRole('link', { name: baseProps.instagramLabel })).toHaveAttribute(
      'href',
      baseProps.instagramDmUrl
    );
  });

  it('omits the Google Page link when googleProfileUrl is null', () => {
    render(<Footer {...baseProps} googleProfileUrl={null} />);
    expect(screen.queryByRole('link', { name: baseProps.googleLabel })).toBeNull();
  });

  it('renders the Google Page link when googleProfileUrl is provided', () => {
    render(<Footer {...baseProps} googleProfileUrl="https://g.page/cab-detailing" />);
    expect(screen.getByRole('link', { name: baseProps.googleLabel })).toHaveAttribute(
      'href',
      'https://g.page/cab-detailing'
    );
  });

  it('renders the current year and the configured copyright suffix', () => {
    render(<Footer {...baseProps} googleProfileUrl={null} />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(baseProps.copyrightSuffix))).toBeInTheDocument();
  });

  it('renders a disabled pending state when instagramDmUrl is null', () => {
    render(<Footer {...baseProps} instagramDmUrl={null} googleProfileUrl={null} />);
    expect(screen.queryByRole('link', { name: baseProps.instagramLabel })).toBeNull();
    expect(screen.getByText(baseProps.instagramPendingLabel)).toBeInTheDocument();
  });
});
