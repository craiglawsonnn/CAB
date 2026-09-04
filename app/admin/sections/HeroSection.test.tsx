import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HeroSection from './HeroSection';
import type { HeroConfig } from '@/content/site';

const content: HeroConfig = {
  badge: 'Mobile & Premium Service',
  headline: 'Premium Detailing for Cars, Airplanes & Boats',
  subtitle: 'Mobile service. Unmatched quality.',
  instagramButtonLabel: 'Book via Instagram DM',
  callButtonPrefix: 'Call / Text ',
};

describe('HeroSection', () => {
  it('renders current values', () => {
    render(<HeroSection content={content} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Badge')).toHaveValue(content.badge);
    expect(screen.getByLabelText('Headline')).toHaveValue(content.headline);
    expect(screen.getByLabelText('Subtitle')).toHaveValue(content.subtitle);
  });

  it('calls onChange with an updated field, preserving the rest', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<HeroSection content={content} onChange={onChange} />);
    await user.type(screen.getByLabelText('Badge'), 'X');
    expect(onChange).toHaveBeenLastCalledWith({ ...content, badge: `${content.badge}X` });
  });
});
