import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SaveBar from './SaveBar';
import { siteConfig, type SiteConfig } from '@/content/site';

function getPublishedPaths(config: SiteConfig): Set<string> {
  return new Set<string>([
    config.logoSrc,
    config.heroImageSrc,
    ...config.gallery.images.map((image) => image.src),
    ...config.beforeAfter.pairs.flatMap((pair) => [pair.beforeSrc, pair.afterSrc]),
  ]);
}

// siteConfig's own images are already published in production (AdminDashboard
// derives publishedPaths from initialContent); mirror that here so tests that
// don't add a brand-new item aren't tripped up by Fix 2's missing-image check.
const publishedPaths = getPublishedPaths(siteConfig);

describe('SaveBar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('posts the content to /api/admin/save and shows a success message', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ ok: true, commitSha: 'abc123' }), { status: 200 }));
    const onSaved = vi.fn();
    const user = userEvent.setup();
    render(<SaveBar content={siteConfig} publishedPaths={publishedPaths} onSaved={onSaved} />);

    await user.click(screen.getByRole('button', { name: 'Save & Publish' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: siteConfig, images: [] }),
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Saved');
    expect(onSaved).toHaveBeenCalled();
  });

  it('shows the API error message when the save is rejected', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: 'Invalid request payload.' }), { status: 400 })
    );
    const user = userEvent.setup();
    render(<SaveBar content={siteConfig} publishedPaths={publishedPaths} />);

    await user.click(screen.getByRole('button', { name: 'Save & Publish' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid request payload.');
  });

  it('shows a network-error message when fetch rejects', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));
    const user = userEvent.setup();
    render(<SaveBar content={siteConfig} publishedPaths={publishedPaths} />);

    await user.click(screen.getByRole('button', { name: 'Save & Publish' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Network error');
  });

  it('resolves pending image uploads and deletes into the images array before posting', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ ok: true, commitSha: 'abc' }), { status: 200 }));
    const file = new File(['fake-bytes'], 'new.jpg', { type: 'image/jpeg' });
    const user = userEvent.setup();
    render(
      <SaveBar
        content={siteConfig}
        publishedPaths={publishedPaths}
        pendingImages={{ '/images/new.jpg': file }}
        pendingDeletes={['/images/old.jpg']}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Save & Publish' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Saved');
    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse((requestInit as RequestInit).body as string);
    expect(body.images).toEqual([
      { path: 'public/images/new.jpg', action: 'upsert', base64: Buffer.from('fake-bytes').toString('base64') },
      { path: 'public/images/old.jpg', action: 'delete' },
    ]);
  });

  it('blocks the save and shows an error when a referenced image has no published or staged file', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(new Response('', { status: 200 }));
    const content = {
      ...siteConfig,
      gallery: {
        ...siteConfig.gallery,
        images: [
          ...siteConfig.gallery.images,
          { id: 'gallery-new', src: '/images/gallery-new.jpg', alt: '', caption: '' },
        ],
      },
    };
    const user = userEvent.setup();
    render(<SaveBar content={content} publishedPaths={publishedPaths} />);

    await user.click(screen.getByRole('button', { name: 'Save & Publish' }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent('photo needs an image selected before publishing');
  });

  it('allows the save when the new item has a matching staged pending image', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ ok: true, commitSha: 'abc' }), { status: 200 }));
    const content = {
      ...siteConfig,
      gallery: {
        ...siteConfig.gallery,
        images: [
          ...siteConfig.gallery.images,
          { id: 'gallery-new', src: '/images/gallery-new.jpg', alt: '', caption: '' },
        ],
      },
    };
    const file = new File(['gallery-bytes'], 'gallery-new.jpg', { type: 'image/jpeg' });
    const user = userEvent.setup();
    render(
      <SaveBar
        content={content}
        publishedPaths={publishedPaths}
        pendingImages={{ '/images/gallery-new.jpg': file }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Save & Publish' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Saved');
    expect(fetchMock).toHaveBeenCalled();
  });

  it('blocks the save and shows an error when total pending image size exceeds the 3 MB cap', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(new Response('', { status: 200 }));
    const bigFile = new File([new Uint8Array(4 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    const user = userEvent.setup();
    render(
      <SaveBar
        content={siteConfig}
        publishedPaths={publishedPaths}
        pendingImages={{ '/images/big.jpg': bigFile }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Save & Publish' }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent('too large to publish together');
  });
});
