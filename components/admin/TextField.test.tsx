import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextField from './TextField';

describe('TextField', () => {
  it('renders the label and current value', () => {
    render(<TextField label="Business Name" value="CAB Premium Detailing" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Business Name')).toHaveValue('CAB Premium Detailing');
  });

  it('calls onChange with the new value as the user types', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TextField label="Business Name" value="" onChange={onChange} />);
    await user.type(screen.getByLabelText('Business Name'), 'X');
    expect(onChange).toHaveBeenCalledWith('X');
  });
});
