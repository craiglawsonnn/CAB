import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GallerySection from './GallerySection';
import type { GalleryConfig } from '@/content/site';

const content: GalleryConfig = {
  heading: 'Gallery',
  subtitle: 'More of our recent work',
  images: [{ id: 'a', src: '/images/a.jpg', alt: 'Photo A', caption: 'Caption A' }],
};

describe('GallerySection', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview');
  });

  it('renders current values', () => {
    render(
      <GallerySection content={content} onChange={vi.fn()} onImageSelected={vi.fn()} onImageRemoved={vi.fn()} />
    );
    expect(screen.getByLabelText('Heading')).toHaveValue(content.heading);
    expect(screen.getByLabelText('Alt Text')).toHaveValue('Photo A');
    expect(screen.getByAltText('Photo')).toHaveAttribute('src', '/images/a.jpg');
  });

  it('calls onImageSelected with the image path when a new photo is chosen', async () => {
    const onImageSelected = vi.fn();
    const user = userEvent.setup();
    render(
      <GallerySection
        content={content}
        onChange={vi.fn()}
        onImageSelected={onImageSelected}
        onImageRemoved={vi.fn()}
      />
    );
    const file = new File(['data'], 'new.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText('Replace'), file);
    expect(onImageSelected).toHaveBeenCalledWith('/images/a.jpg', file);
  });

  it('calls onImageRemoved with the removed image path when Remove is clicked', async () => {
    const onChange = vi.fn();
    const onImageRemoved = vi.fn();
    const user = userEvent.setup();
    render(
      <GallerySection
        content={content}
        onChange={onChange}
        onImageSelected={vi.fn()}
        onImageRemoved={onImageRemoved}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onImageRemoved).toHaveBeenCalledWith('/images/a.jpg');
    expect(onChange).toHaveBeenCalledWith({ ...content, images: [] });
  });

  it('adds a new photo with a generated id and src when Add Photo is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <GallerySection content={content} onChange={onChange} onImageSelected={vi.fn()} onImageRemoved={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: 'Add Photo' }));
    const [updated] = onChange.mock.calls[0];
    expect(updated.images).toHaveLength(2);
    expect(updated.images[1]).toMatchObject({ alt: '', caption: '' });
    expect(updated.images[1].src).toMatch(/^\/images\/gallery-\d+\.jpg$/);
  });
});
