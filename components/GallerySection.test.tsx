import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GallerySection from '@/components/GallerySection';

const images = [
  { id: 'a', src: '/images/headlight-restore.jpg', alt: 'Headlight before and after', caption: 'Headlight Restoration' },
];

describe('GallerySection', () => {
  it('renders every gallery image with its alt text and caption', () => {
    render(<GallerySection images={images} />);
    for (const image of images) {
      expect(screen.getByAltText(image.alt)).toHaveAttribute('src', image.src);
      expect(screen.getByText(image.caption)).toBeInTheDocument();
    }
  });

  it('sets the section id to gallery', () => {
    render(<GallerySection images={images} />);
    expect(document.getElementById('gallery')).not.toBeNull();
  });
});
