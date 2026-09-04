import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReelsSection from './ReelsSection';
import type { ReelsConfig } from '@/content/site';

const content: ReelsConfig = {
  heading: 'Video Showcase',
  subtitle: 'Watch our process in action',
  comingSoonLabel: 'Coming soon',
  items: [{ id: 'reel-1', caption: 'Full Detail Walkthrough', embedUrl: 'https://www.instagram.com/reel/abc/' }],
};

describe('ReelsSection', () => {
  it('renders current values', () => {
    render(<ReelsSection content={content} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Heading')).toHaveValue(content.heading);
    expect(screen.getByLabelText('Caption')).toHaveValue('Full Detail Walkthrough');
    expect(screen.getByLabelText('Instagram/TikTok URL')).toHaveValue('https://www.instagram.com/reel/abc/');
  });

  it('calls onChange with an appended reel when Add Reel is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ReelsSection content={content} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Add Reel' }));
    const [updated] = onChange.mock.calls[0];
    expect(updated.items).toHaveLength(2);
    expect(updated.items[1]).toMatchObject({ caption: '', embedUrl: null });
  });

  it('converts a blank reel URL to null', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ReelsSection content={content} onChange={onChange} />);
    await user.clear(screen.getByLabelText('Instagram/TikTok URL'));
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.items[0].embedUrl).toBeNull();
  });
});
