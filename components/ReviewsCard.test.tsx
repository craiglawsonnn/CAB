import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReviewsCard from '@/components/ReviewsCard';

describe('ReviewsCard', () => {
  it('renders the rating and review count', () => {
    render(<ReviewsCard rating={4.9} reviewCount={50} profileUrl={null} />);
    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText('(50+ Google Reviews)')).toBeInTheDocument();
  });

  it('renders a real link when profileUrl is provided', () => {
    render(<ReviewsCard rating={4.9} reviewCount={50} profileUrl="https://g.page/cab-detailing" />);
    expect(screen.getByRole('link', { name: 'View on Google' })).toHaveAttribute(
      'href',
      'https://g.page/cab-detailing'
    );
  });

  it('renders a disabled pending state when profileUrl is null', () => {
    render(<ReviewsCard rating={4.9} reviewCount={50} profileUrl={null} />);
    expect(screen.queryByRole('link', { name: 'View on Google' })).toBeNull();
    expect(screen.getByText('Google reviews link coming soon')).toBeInTheDocument();
  });

  it('sets the section id to reviews', () => {
    render(<ReviewsCard rating={4.9} reviewCount={50} profileUrl={null} />);
    expect(document.getElementById('reviews')).not.toBeNull();
  });
});
