// components/Footer.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';

const baseProps = {
  logoSrc: '/images/logo.jpg',
  businessName: 'CAB Premium Detailing',
  instagramDmUrl: 'https://instagram.com/direct/inbox/',
};

describe('Footer', () => {
  it('renders an Instagram link using instagramDmUrl', () => {
    render(<Footer {...baseProps} googleProfileUrl={null} />);
    expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
      'href',
      baseProps.instagramDmUrl
    );
  });

  it('omits the Google Page link when googleProfileUrl is null', () => {
    render(<Footer {...baseProps} googleProfileUrl={null} />);
    expect(screen.queryByRole('link', { name: 'Google Page' })).toBeNull();
  });

  it('renders the Google Page link when googleProfileUrl is provided', () => {
    render(<Footer {...baseProps} googleProfileUrl="https://g.page/cab-detailing" />);
    expect(screen.getByRole('link', { name: 'Google Page' })).toHaveAttribute(
      'href',
      'https://g.page/cab-detailing'
    );
  });

  it('renders the current year in the copyright line', () => {
    render(<Footer {...baseProps} googleProfileUrl={null} />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it('renders a disabled pending state when instagramDmUrl is null', () => {
    render(<Footer {...baseProps} instagramDmUrl={null} googleProfileUrl={null} />);
    expect(screen.queryByRole('link', { name: 'Instagram' })).toBeNull();
    expect(screen.getByText('Instagram DM — coming soon')).toBeInTheDocument();
  });
});
