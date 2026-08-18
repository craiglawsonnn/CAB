import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';

const pair = {
  id: 'test-pair',
  beforeSrc: '/images/test-before.jpg',
  afterSrc: '/images/test-after.jpg',
  beforeAlt: 'Before test',
  afterAlt: 'After test',
  caption: 'Test caption',
};

describe('BeforeAfterSlider', () => {
  it('renders the caption and before/after tags', () => {
    render(<BeforeAfterSlider pair={pair} />);
    expect(screen.getByText('Test caption')).toBeInTheDocument();
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });

  it('starts at the 50% position', () => {
    render(<BeforeAfterSlider pair={pair} />);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '50');
  });

  it('moves right on ArrowRight and left on ArrowLeft', async () => {
    const user = userEvent.setup();
    render(<BeforeAfterSlider pair={pair} />);
    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '55');
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(slider).toHaveAttribute('aria-valuenow', '45');
  });
});
