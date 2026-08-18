import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReelEmbed from '@/components/ReelEmbed';

describe('ReelEmbed', () => {
  it('renders a coming-soon placeholder when embedUrl is null', () => {
    render(<ReelEmbed reel={{ id: 'r1', caption: 'Aircraft wash', embedUrl: null }} />);
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
    expect(screen.getByText('Aircraft wash')).toBeInTheDocument();
  });

  it('renders an instagram blockquote embed when given an instagram url', () => {
    render(
      <ReelEmbed
        reel={{
          id: 'r2',
          caption: 'Yacht polish',
          embedUrl: 'https://www.instagram.com/reel/xyz/',
        }}
      />
    );
    const blockquote = document.querySelector('blockquote.instagram-media');
    expect(blockquote).not.toBeNull();
    expect(blockquote).toHaveAttribute(
      'data-instgrm-permalink',
      'https://www.instagram.com/reel/xyz/'
    );
  });

  it('renders a tiktok blockquote embed when given a tiktok url', () => {
    render(
      <ReelEmbed
        reel={{
          id: 'r3',
          caption: 'Paint correction',
          embedUrl: 'https://www.tiktok.com/@cab/video/123',
        }}
      />
    );
    const blockquote = document.querySelector('blockquote.tiktok-embed');
    expect(blockquote).not.toBeNull();
  });
});
