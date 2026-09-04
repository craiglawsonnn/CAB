import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SiteImagesSection from './SiteImagesSection';

describe('SiteImagesSection', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview');
  });

  it('renders the current logo and hero images', () => {
    render(
      <SiteImagesSection logoSrc="/images/logo.jpg" heroImageSrc="/images/hero.jpg" onImageSelected={vi.fn()} />
    );
    expect(screen.getByAltText('Logo')).toHaveAttribute('src', '/images/logo.jpg');
    expect(screen.getByAltText('Hero Photo')).toHaveAttribute('src', '/images/hero.jpg');
  });

  it('calls onImageSelected with the existing logo path when a new logo file is chosen', async () => {
    const onImageSelected = vi.fn();
    const user = userEvent.setup();
    render(
      <SiteImagesSection
        logoSrc="/images/logo.jpg"
        heroImageSrc="/images/hero.jpg"
        onImageSelected={onImageSelected}
      />
    );
    const file = new File(['data'], 'new-logo.jpg', { type: 'image/jpeg' });
    const inputs = screen.getAllByLabelText('Replace');
    await user.upload(inputs[0], file);
    expect(onImageSelected).toHaveBeenCalledWith('/images/logo.jpg', file);
  });
});
