import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BeforeAfterSection from './BeforeAfterSection';
import type { BeforeAfterConfig } from '@/content/site';

const content: BeforeAfterConfig = {
  heading: 'Our Work: Before & After',
  subtitle: 'Drag the divider to see the transformation',
  viewMoreTemplate: 'View {count} More',
  showFewerLabel: 'Show Fewer',
  beforeTagLabel: 'Before',
  afterTagLabel: 'After',
  ariaLabelPrefix: 'Before and after comparison: ',
  pairs: [
    {
      id: 'p1',
      beforeSrc: '/images/p1-before.jpg',
      afterSrc: '/images/p1-after.jpg',
      beforeAlt: 'Before shot',
      afterAlt: 'After shot',
      caption: 'Driver Door',
    },
  ],
};

describe('BeforeAfterSection', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview');
  });

  it('renders current values', () => {
    render(
      <BeforeAfterSection content={content} onChange={vi.fn()} onImageSelected={vi.fn()} onImageRemoved={vi.fn()} />
    );
    expect(screen.getByLabelText('Heading')).toHaveValue(content.heading);
    expect(screen.getByLabelText('Caption')).toHaveValue('Driver Door');
    expect(screen.getByAltText('Before Photo')).toHaveAttribute('src', '/images/p1-before.jpg');
    expect(screen.getByAltText('After Photo')).toHaveAttribute('src', '/images/p1-after.jpg');
  });

  it('calls onImageSelected with the correct path for the before and after images', async () => {
    const onImageSelected = vi.fn();
    const user = userEvent.setup();
    render(
      <BeforeAfterSection
        content={content}
        onChange={vi.fn()}
        onImageSelected={onImageSelected}
        onImageRemoved={vi.fn()}
      />
    );
    const file = new File(['data'], 'new.jpg', { type: 'image/jpeg' });
    const inputs = screen.getAllByLabelText('Replace');
    await user.upload(inputs[0], file);
    expect(onImageSelected).toHaveBeenCalledWith('/images/p1-before.jpg', file);
    await user.upload(inputs[1], file);
    expect(onImageSelected).toHaveBeenCalledWith('/images/p1-after.jpg', file);
  });

  it('calls onImageRemoved for both images when a pair is removed', async () => {
    const onImageRemoved = vi.fn();
    const user = userEvent.setup();
    render(
      <BeforeAfterSection
        content={content}
        onChange={vi.fn()}
        onImageSelected={vi.fn()}
        onImageRemoved={onImageRemoved}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onImageRemoved).toHaveBeenCalledWith('/images/p1-before.jpg');
    expect(onImageRemoved).toHaveBeenCalledWith('/images/p1-after.jpg');
  });

  it('adds a new pair with generated ids and image paths when Add Pair is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <BeforeAfterSection content={content} onChange={onChange} onImageSelected={vi.fn()} onImageRemoved={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: 'Add Pair' }));
    const [updated] = onChange.mock.calls[0];
    expect(updated.pairs).toHaveLength(2);
    expect(updated.pairs[1].beforeSrc).toMatch(/^\/images\/pair-\d+-before\.jpg$/);
    expect(updated.pairs[1].afterSrc).toMatch(/^\/images\/pair-\d+-after\.jpg$/);
  });
});
