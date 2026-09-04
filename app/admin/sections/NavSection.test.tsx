import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavSection from './NavSection';
import type { NavConfig } from '@/content/site';

const content: NavConfig = {
  links: [{ href: '#services', label: 'Services' }],
  callButtonLabel: 'Call Now',
  instagramButtonLabel: 'DM on Instagram',
};

describe('NavSection', () => {
  it('renders the nav link fields and button labels', () => {
    render(<NavSection content={content} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Label')).toHaveValue('Services');
    expect(screen.getByLabelText('Link (e.g. #services)')).toHaveValue('#services');
    expect(screen.getByLabelText('Call Button Label')).toHaveValue('Call Now');
  });

  it('calls onChange with an appended link when Add Nav Link is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<NavSection content={content} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Add Nav Link' }));
    expect(onChange).toHaveBeenCalledWith({
      ...content,
      links: [...content.links, { href: '#', label: 'New Link' }],
    });
  });

  it('calls onChange with an updated button label, preserving links', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<NavSection content={content} onChange={onChange} />);
    await user.type(screen.getByLabelText('Call Button Label'), 'X');
    expect(onChange).toHaveBeenLastCalledWith({ ...content, callButtonLabel: 'Call NowX' });
  });
});
