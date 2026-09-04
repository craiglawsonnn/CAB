import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    expect(screen.getByRole('heading', { name: 'Navigation' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hero' })).toBeInTheDocument();
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
    expect(body.content.gallery).toEqual(siteConfig.gallery);
    expect(body.images).toEqual([]);
  });
});
