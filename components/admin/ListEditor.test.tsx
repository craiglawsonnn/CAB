import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ListEditor from './ListEditor';
import TextField from './TextField';

interface Item {
  id: string;
  text: string;
}

function renderList(items: Item[], onChange: (items: Item[]) => void) {
  return render(
    <ListEditor<Item>
      items={items}
      onChange={onChange}
      getKey={(item) => item.id}
      createItem={() => ({ id: 'new', text: '' })}
      addLabel="Add Item"
      renderItem={(item, onUpdate) => (
        <TextField label={`Item ${item.id}`} value={item.text} onChange={(text) => onUpdate({ text })} />
      )}
    />
  );
}

describe('ListEditor', () => {
  it('renders one field per item', () => {
    renderList(
      [
        { id: 'a', text: 'First' },
        { id: 'b', text: 'Second' },
      ],
      vi.fn()
    );
    expect(screen.getByLabelText('Item a')).toHaveValue('First');
    expect(screen.getByLabelText('Item b')).toHaveValue('Second');
  });

  it('calls onChange with an appended item when Add is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderList([{ id: 'a', text: 'First' }], onChange);
    await user.click(screen.getByRole('button', { name: 'Add Item' }));
    expect(onChange).toHaveBeenCalledWith([
      { id: 'a', text: 'First' },
      { id: 'new', text: '' },
    ]);
  });

  it('calls onChange with the item removed when Remove is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderList(
      [
        { id: 'a', text: 'First' },
        { id: 'b', text: 'Second' },
      ],
      onChange
    );
    await user.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
    expect(onChange).toHaveBeenCalledWith([{ id: 'b', text: 'Second' }]);
  });

  it('swaps two items when Move down is clicked on the first one', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderList(
      [
        { id: 'a', text: 'First' },
        { id: 'b', text: 'Second' },
      ],
      onChange
    );
    await user.click(screen.getAllByRole('button', { name: 'Move down' })[0]);
    expect(onChange).toHaveBeenCalledWith([
      { id: 'b', text: 'Second' },
      { id: 'a', text: 'First' },
    ]);
  });

  it('disables Move up on the first item and Move down on the last item', () => {
    renderList(
      [
        { id: 'a', text: 'First' },
        { id: 'b', text: 'Second' },
      ],
      vi.fn()
    );
    const moveUpButtons = screen.getAllByRole('button', { name: 'Move up' });
    const moveDownButtons = screen.getAllByRole('button', { name: 'Move down' });
    expect(moveUpButtons[0]).toBeDisabled();
    expect(moveDownButtons[moveDownButtons.length - 1]).toBeDisabled();
  });
});
