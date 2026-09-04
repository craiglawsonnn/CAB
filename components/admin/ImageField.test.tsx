import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageField from './ImageField';

describe('ImageField', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview');
  });

  it('renders the current image', () => {
    render(<ImageField label="Logo" currentSrc="/images/logo.jpg" onFileSelected={vi.fn()} />);
    expect(screen.getByAltText('Logo')).toHaveAttribute('src', '/images/logo.jpg');
  });

  it('calls onFileSelected and updates the preview when a file is chosen', async () => {
    const onFileSelected = vi.fn();
    const user = userEvent.setup();
    render(<ImageField label="Logo" currentSrc="/images/logo.jpg" onFileSelected={onFileSelected} />);

    const file = new File(['fake-image-data'], 'new-logo.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Replace') as HTMLInputElement;
    await user.upload(input, file);

    expect(onFileSelected).toHaveBeenCalledWith(file);
    expect(screen.getByAltText('Logo')).toHaveAttribute('src', 'blob:mock-preview');
  });
});
