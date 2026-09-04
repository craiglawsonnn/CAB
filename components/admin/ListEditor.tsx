'use client';

import styles from './ListEditor.module.css';

export interface ListEditorProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  getKey: (item: T, index: number) => string;
  createItem: () => T;
  addLabel: string;
  renderItem: (item: T, onUpdate: (patch: Partial<T>) => void) => React.ReactNode;
}

export default function ListEditor<T,>({
  items,
  onChange,
  getKey,
  createItem,
  addLabel,
  renderItem,
}: ListEditorProps<T>) {
  const updateAt = (index: number, patch: Partial<T>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeAt = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...items];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };

  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    const next = [...items];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  };

  return (
    <div className={styles.list}>
      {items.map((item, index) => (
        <div key={getKey(item, index)} className={styles.item}>
          {renderItem(item, (patch) => updateAt(index, patch))}
          <div className={styles.controls}>
            <button type="button" onClick={() => moveUp(index)} disabled={index === 0}>
              Move up
            </button>
            <button type="button" onClick={() => moveDown(index)} disabled={index === items.length - 1}>
              Move down
            </button>
            <button type="button" onClick={() => removeAt(index)}>
              Remove
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, createItem()])}>
        {addLabel}
      </button>
    </div>
  );
}
