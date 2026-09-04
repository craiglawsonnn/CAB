import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactSection from './ContactSection';
import type { ContactConfig } from '@/content/site';

const content: ContactConfig = {
  heading: 'Ready to Book Your Detail?',
  body: 'DM us on Instagram or call/text.',
  instagramButtonLabel: 'DM Us on Instagram',
  callButtonPrefix: 'Call / Text ',
};

describe('ContactSection', () => {
  it('renders current values', () => {
    render(<ContactSection content={content} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Heading')).toHaveValue(content.heading);
    expect(screen.getByLabelText('Body')).toHaveValue(content.body);
  });

  it('calls onChange with an updated field, preserving the rest', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ContactSection content={content} onChange={onChange} />);
    await user.type(screen.getByLabelText('Heading'), 'X');
    expect(onChange).toHaveBeenLastCalledWith({ ...content, heading: `${content.heading}X` });
  });
});
