import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FooterSection from './FooterSection';
import type { FooterConfig } from '@/content/site';

const content: FooterConfig = {
  copyrightSuffix: 'All rights reserved.',
  instagramLabel: 'Instagram',
  googleLabel: 'Google Page',
};

describe('FooterSection', () => {
  it('renders current values', () => {
    render(<FooterSection content={content} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Copyright Suffix')).toHaveValue(content.copyrightSuffix);
  });

  it('calls onChange with an updated field, preserving the rest', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<FooterSection content={content} onChange={onChange} />);
    await user.type(screen.getByLabelText('Copyright Suffix'), 'X');
    expect(onChange).toHaveBeenLastCalledWith({ ...content, copyrightSuffix: `${content.copyrightSuffix}X` });
  });
});
