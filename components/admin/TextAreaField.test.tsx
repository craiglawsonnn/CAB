import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextAreaField from './TextAreaField';

describe('TextAreaField', () => {
  it('renders the label and current value', () => {
    render(<TextAreaField label="Subtitle" value="Mobile service." onChange={vi.fn()} />);
    expect(screen.getByLabelText('Subtitle')).toHaveValue('Mobile service.');
  });

  it('calls onChange with the new value as the user types', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TextAreaField label="Subtitle" value="" onChange={onChange} />);
    await user.type(screen.getByLabelText('Subtitle'), 'X');
    expect(onChange).toHaveBeenCalledWith('X');
  });
});
