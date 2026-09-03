import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReviewsCard from '@/components/ReviewsCard';

const copyProps = {
  heading: 'What Our Clients Say',
  countTemplate: '({count}+ Google Reviews)',
  viewButtonLabel: 'View on Google',
  pendingLabel: 'Google reviews link coming soon',
};

describe('ReviewsCard', () => {
  it('renders the rating and review count', () => {
    render(<ReviewsCard rating={4.9} reviewCount={50} profileUrl={null} {...copyProps} />);
    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText('(50+ Google Reviews)')).toBeInTheDocument();
  });

  it('renders the configured heading', () => {
    render(<ReviewsCard rating={4.9} reviewCount={50} profileUrl={null} {...copyProps} />);
    expect(screen.getByRole('heading', { name: copyProps.heading })).toBeInTheDocument();
  });

  it('renders a real link when profileUrl is provided', () => {
    render(
      <ReviewsCard
        rating={4.9}
        reviewCount={50}
        profileUrl="https://g.page/cab-detailing"
        {...copyProps}
      />
    );
    expect(screen.getByRole('link', { name: copyProps.viewButtonLabel })).toHaveAttribute(
      'href',
      'https://g.page/cab-detailing'
    );
  });

  it('renders a disabled pending state when profileUrl is null', () => {
    render(<ReviewsCard rating={4.9} reviewCount={50} profileUrl={null} {...copyProps} />);
    expect(screen.queryByRole('link', { name: copyProps.viewButtonLabel })).toBeNull();
    expect(screen.getByText(copyProps.pendingLabel)).toBeInTheDocument();
  });

  it('sets the section id to reviews', () => {
    render(<ReviewsCard rating={4.9} reviewCount={50} profileUrl={null} {...copyProps} />);
    expect(document.getElementById('reviews')).not.toBeNull();
  });
});
