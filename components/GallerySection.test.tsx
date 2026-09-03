import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GallerySection from '@/components/GallerySection';

const images = [
  { id: 'a', src: '/images/headlight-restore.jpg', alt: 'Headlight before and after', caption: 'Headlight Restoration' },
];
const heading = 'Gallery';
const subtitle = 'More of our recent work';

describe('GallerySection', () => {
  it('renders every gallery image with its alt text and caption', () => {
    render(<GallerySection images={images} heading={heading} subtitle={subtitle} />);
    for (const image of images) {
      expect(screen.getByAltText(image.alt)).toHaveAttribute('src', image.src);
      expect(screen.getByText(image.caption)).toBeInTheDocument();
    }
  });

  it('renders the configured heading and subtitle', () => {
    render(<GallerySection images={images} heading={heading} subtitle={subtitle} />);
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    expect(screen.getByText(subtitle)).toBeInTheDocument();
  });

  it('sets the section id to gallery', () => {
    render(<GallerySection images={images} heading={heading} subtitle={subtitle} />);
    expect(document.getElementById('gallery')).not.toBeNull();
  });
});
