import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SaveBar from './SaveBar';
import { siteConfig } from '@/content/site';

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
    render(<SaveBar content={siteConfig} onSaved={onSaved} />);

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
    render(<SaveBar content={siteConfig} />);

    await user.click(screen.getByRole('button', { name: 'Save & Publish' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid request payload.');
  });

  it('shows a network-error message when fetch rejects', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));
    const user = userEvent.setup();
    render(<SaveBar content={siteConfig} />);

    await user.click(screen.getByRole('button', { name: 'Save & Publish' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Network error');
  });
});
