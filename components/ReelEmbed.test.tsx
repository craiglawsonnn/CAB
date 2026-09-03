import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReelEmbed from '@/components/ReelEmbed';

const INSTAGRAM_SCRIPT_SRC = 'https://www.instagram.com/embed.js';

type WindowWithInstgrm = typeof window & {
  instgrm?: { Embeds?: { process?: () => void } };
};

afterEach(() => {
  document
    .querySelectorAll(`script[src="${INSTAGRAM_SCRIPT_SRC}"]`)
    .forEach((script) => script.remove());
  delete (window as WindowWithInstgrm).instgrm;
});

const comingSoonLabel = 'Coming soon';

describe('ReelEmbed', () => {
  it('renders a coming-soon placeholder when embedUrl is null', () => {
    render(
      <ReelEmbed
        reel={{ id: 'r1', caption: 'Aircraft wash', embedUrl: null }}
        comingSoonLabel={comingSoonLabel}
      />
    );
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
        comingSoonLabel={comingSoonLabel}
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
        comingSoonLabel={comingSoonLabel}
      />
    );
    const blockquote = document.querySelector('blockquote.tiktok-embed');
    expect(blockquote).not.toBeNull();
  });
});

describe('ReelEmbed shared-script race condition', () => {
  it('does not process embeds immediately when the shared script exists but has not finished loading', () => {
    // Simulate a prior ReelEmbed instance having already appended the
    // platform script to the DOM (mount order: instance A appended it,
    // instance B is mounting now), but the async script has not fired its
    // `load` event yet — i.e. `dataset.loaded` is unset.
    const script = document.createElement('script');
    script.src = INSTAGRAM_SCRIPT_SRC;
    document.body.appendChild(script);

    const process = vi.fn();
    (window as WindowWithInstgrm).instgrm = { Embeds: { process } };

    render(
      <ReelEmbed
        reel={{ id: 'r4', caption: 'Second instagram reel', embedUrl: 'https://www.instagram.com/reel/second/' }}
        comingSoonLabel={comingSoonLabel}
      />
    );

    // The script hasn't loaded yet, so process() must not have been called
    // (calling it now would silently no-op against a not-yet-defined global
    // in the real browser, and this instance's blockquote would never be
    // converted).
    expect(process).not.toHaveBeenCalled();

    // Once the shared script finishes loading, this instance's listener
    // should fire and process its blockquote.
    script.dispatchEvent(new Event('load'));
    expect(process).toHaveBeenCalledTimes(1);
  });

  it('processes embeds immediately when the shared script is already marked loaded', () => {
    const script = document.createElement('script');
    script.src = INSTAGRAM_SCRIPT_SRC;
    script.dataset.loaded = 'true';
    document.body.appendChild(script);

    const process = vi.fn();
    (window as WindowWithInstgrm).instgrm = { Embeds: { process } };

    render(
      <ReelEmbed
        reel={{ id: 'r5', caption: 'Third instagram reel', embedUrl: 'https://www.instagram.com/reel/third/' }}
        comingSoonLabel={comingSoonLabel}
      />
    );

    expect(process).toHaveBeenCalledTimes(1);
  });
});
