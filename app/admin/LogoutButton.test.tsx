import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

import LogoutButton from './LogoutButton';

describe('LogoutButton', () => {
  beforeEach(() => {
    pushMock.mockClear();
    vi.restoreAllMocks();
  });

  it('calls the logout endpoint and redirects to the login page', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(new Response('{}'));
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/logout', { method: 'POST' });
    expect(pushMock).toHaveBeenCalledWith('/admin/login');
  });
});
