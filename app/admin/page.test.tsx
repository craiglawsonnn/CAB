import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import AdminDashboardPage from './page';

describe('AdminDashboardPage', () => {
  it('renders the dashboard heading, at least one real section, and a logout button', () => {
    render(<AdminDashboardPage />);
    expect(screen.getByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Site Basics' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });
});
