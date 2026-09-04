import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BasicsSection, { type BasicsFields } from './BasicsSection';

const fields: BasicsFields = {
  businessName: 'CAB Premium Detailing',
  phoneDisplay: '(406) 609-5321',
  phoneHref: 'tel:+14066095321',
  instagramDmUrl: 'https://ig.me/m/cab.premiumdetailing',
  instagramPendingLabel: 'Instagram DM — coming soon',
  seoTitle: 'CAB Premium Detailing',
  seoDescription: 'Mobile detailing.',
};

describe('BasicsSection', () => {
  it('renders current values', () => {
    render(<BasicsSection fields={fields} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Business Name')).toHaveValue(fields.businessName);
    expect(screen.getByLabelText(/Instagram DM URL/)).toHaveValue(fields.instagramDmUrl);
  });

  it('calls onChange with an updated field, preserving the rest', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<BasicsSection fields={fields} onChange={onChange} />);
    await user.type(screen.getByLabelText('Business Name'), 'X');
    expect(onChange).toHaveBeenLastCalledWith({ ...fields, businessName: `${fields.businessName}X` });
  });

  it('converts a blank Instagram DM URL to null', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<BasicsSection fields={fields} onChange={onChange} />);
    await user.clear(screen.getByLabelText(/Instagram DM URL/));
    expect(onChange).toHaveBeenLastCalledWith({ ...fields, instagramDmUrl: null });
  });
});
