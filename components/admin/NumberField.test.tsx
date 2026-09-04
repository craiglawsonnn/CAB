import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NumberField from './NumberField';

describe('NumberField', () => {
  it('renders the current value', () => {
    render(<NumberField label="Rating" value={4.9} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Rating')).toHaveValue('4.9');
  });

  it('allows typing a decimal point without it being erased', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<NumberField label="Rating" value={0} onChange={onChange} />);
    const field = screen.getByLabelText('Rating');
    await user.clear(field);
    await user.type(field, '4.9');
    expect(field).toHaveValue('4.9');
    expect(onChange).toHaveBeenLastCalledWith(4.9);
  });

  it('does not call onChange while the field is empty or unparseable', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<NumberField label="Rating" value={4.9} onChange={onChange} />);
    const field = screen.getByLabelText('Rating');
    await user.clear(field);
    expect(field).toHaveValue('');
    expect(onChange).not.toHaveBeenCalled();
  });
});
