import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewsSection from './ReviewsSection';
import type { GoogleReviewConfig } from '@/content/site';

const content: GoogleReviewConfig = {
  rating: 4.9,
  reviewCount: 50,
  profileUrl: 'https://maps.app.goo.gl/example',
  heading: 'What Our Clients Say',
  countTemplate: '({count}+ Google Reviews)',
  viewButtonLabel: 'View on Google',
  pendingLabel: 'Google reviews link coming soon',
};

describe('ReviewsSection', () => {
  it('renders current values, including numbers as text', () => {
    render(<ReviewsSection content={content} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Heading')).toHaveValue(content.heading);
    expect(screen.getByLabelText(/Rating/)).toHaveValue('4.9');
    expect(screen.getByLabelText('Review Count')).toHaveValue('50');
  });

  it('parses the rating field back into a number', () => {
    const onChange = vi.fn();
    render(<ReviewsSection content={content} onChange={onChange} />);
    const ratingField = screen.getByLabelText(/Rating/);
    fireEvent.change(ratingField, { target: { value: '5' } });
    expect(onChange).toHaveBeenLastCalledWith({ ...content, rating: 5 });
  });

  it('converts a blank profile URL to null', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ReviewsSection content={content} onChange={onChange} />);
    await user.clear(screen.getByLabelText(/Google Profile URL/));
    expect(onChange).toHaveBeenLastCalledWith({ ...content, profileUrl: null });
  });
});
