import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
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

  it('does not lose focus while typing multiple characters into the link field', async () => {
    // A static content prop + a plain mock onChange never actually updates
    // what's on screen (the field is fully controlled), so this regression
    // only shows up when a real parent re-renders with the new value on each
    // keystroke, same as production usage.
    function Wrapper() {
      const [state, setState] = useState(content);
      return <NavSection content={state} onChange={setState} />;
    }
    const user = userEvent.setup();
    render(<Wrapper />);

    const linkField = screen.getByLabelText('Link (e.g. #services)');
    await user.clear(linkField);
    await user.type(linkField, '#about');

    // If the ListEditor key were derived from href (as it changes on every
    // keystroke), React would remount this field's input on each character,
    // dropping focus and losing subsequently typed characters.
    expect(linkField).toHaveValue('#about');
  });
});
