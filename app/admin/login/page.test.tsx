import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

import AdminLoginPage from './page';

describe('AdminLoginPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    vi.restoreAllMocks();
  });

  it('redirects to /admin on a successful login', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    const user = userEvent.setup();
    render(<AdminLoginPage />);

    await user.type(screen.getByLabelText('Password'), 'the-real-password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(pushMock).toHaveBeenCalledWith('/admin');
  });

  it('shows an error message on a failed login', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: 'Incorrect password.' }), { status: 401 })
    );
    const user = userEvent.setup();
    render(<AdminLoginPage />);

    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect password.');
    expect(pushMock).not.toHaveBeenCalled();
  });
});
