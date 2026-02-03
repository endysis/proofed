import { useState } from 'react';
import Icon from '../common/Icon';
import type { Item, ItemType, CreateItemRequest } from '@proofed/shared';

const ITEM_TYPES: { value: ItemType; label: string; icon: string }[] = [
  { value: 'batter', label: 'Batter', icon: 'cake' },
  { value: 'frosting', label: 'Frosting', icon: 'water_drop' },
  { value: 'filling', label: 'Filling', icon: 'icecream' },
  { value: 'dough', label: 'Dough', icon: 'cookie' },
  { value: 'glaze', label: 'Glaze', icon: 'format_paint' },
  { value: 'other', label: 'Other', icon: 'category' },
];

interface ItemFormProps {
  item?: Item;
  onSubmit: (data: CreateItemRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ItemForm({
  item,
  onSubmit,
  onCancel,
  isLoading,
}: ItemFormProps) {
  const [name, setName] = useState(item?.name || '');
  const [type, setType] = useState<ItemType>(item?.type || 'batter');
  const [notes, setNotes] = useState(item?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, type, notes: notes || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Name</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Vanilla Sponge"
          required
          autoFocus
          className="w-full rounded-xl border border-black/10 bg-white h-14 px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      <div>
        <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Type</p>
        <div className="grid grid-cols-3 gap-2">
          {ITEM_TYPES.map((itemType) => (
            <button
              key={itemType.value}
              type="button"
              onClick={() => setType(itemType.value)}
              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                type === itemType.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-black/10 text-dusty-mauve hover:border-pastel-pink'
              }`}
            >
              <Icon name={itemType.icon} size="md" />
              <span className="text-xs font-medium">{itemType.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Notes (optional)</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes or inspiration"
          rows={3}
          className="w-full rounded-xl border border-black/10 bg-white p-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-black/10 font-bold text-[#171112]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="flex-1 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-50"
        >
          {item ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
