// app/admin/AdminDashboard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { siteConfig } from '@/content/site';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import AdminDashboard from './AdminDashboard';

describe('AdminDashboard', () => {
  it('renders every built section with the current content', () => {
    render(<AdminDashboard initialContent={siteConfig} />);
    expect(screen.getByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Site Basics' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Site Images' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Navigation' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hero' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Before & After' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gallery' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Video Showcase' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reviews' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Contact' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Footer' })).toBeInTheDocument();
    expect(screen.getByLabelText('Business Name')).toHaveValue(siteConfig.businessName);
    expect(screen.getByRole('button', { name: 'Save & Publish' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });

  it('sends the full content object, with an edited field, when Save & Publish is clicked', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ ok: true, commitSha: 'abc' }), { status: 200 }));
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<AdminDashboard initialContent={siteConfig} />);

    await user.type(screen.getByLabelText('Business Name'), 'X');
    await user.click(screen.getByRole('button', { name: 'Save & Publish' }));

    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse((requestInit as RequestInit).body as string);
    expect(body.content.businessName).toBe(`${siteConfig.businessName}X`);
    expect(body.content.pricing).toEqual(siteConfig.pricing);
    expect(body.images).toEqual([]);
  });

  it('registers a pending image upload when a photo is replaced in Site Images', async () => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview');
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ ok: true, commitSha: 'abc' }), { status: 200 }));
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<AdminDashboard initialContent={siteConfig} />);

    const file = new File(['new-logo-bytes'], 'logo.jpg', { type: 'image/jpeg' });
    const [logoInput] = screen.getAllByLabelText('Replace');
    await user.upload(logoInput, file);
    await user.click(screen.getByRole('button', { name: 'Save & Publish' }));

    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse((requestInit as RequestInit).body as string);
    expect(body.images).toEqual([
      {
        path: `public${siteConfig.logoSrc}`,
        action: 'upsert',
        base64: Buffer.from('new-logo-bytes').toString('base64'),
      },
    ]);
  });

  it('does not queue a phantom delete when a newly-added gallery photo is removed before saving', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ ok: true, commitSha: 'abc' }), { status: 200 }));
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<AdminDashboard initialContent={siteConfig} />);

    const gallerySection = screen.getByRole('heading', { name: 'Gallery' }).closest('section')!;
    await user.click(within(gallerySection).getByRole('button', { name: 'Add Photo' }));
    const removeButtons = within(gallerySection).getAllByRole('button', { name: 'Remove' });
    await user.click(removeButtons[removeButtons.length - 1]);
    await user.click(screen.getByRole('button', { name: 'Save & Publish' }));

    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse((requestInit as RequestInit).body as string);
    expect(body.images).toEqual([]);
  });

  it('queues a delete when an existing (already-published) gallery photo is removed and saved', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ ok: true, commitSha: 'abc' }), { status: 200 }));
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<AdminDashboard initialContent={siteConfig} />);

    const originalSrc = siteConfig.gallery.images[0].src;
    const gallerySection = screen.getByRole('heading', { name: 'Gallery' }).closest('section')!;
    await user.click(within(gallerySection).getByRole('button', { name: 'Remove' }));
    await user.click(screen.getByRole('button', { name: 'Save & Publish' }));

    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse((requestInit as RequestInit).body as string);
    expect(body.images).toEqual([{ path: `public${originalSrc}`, action: 'delete' }]);
  });
});
