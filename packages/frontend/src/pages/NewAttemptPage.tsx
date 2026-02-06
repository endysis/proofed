import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useItems } from '../hooks/useItems';
import { useRecipes } from '../hooks/useRecipes';
import { useVariants } from '../hooks/useVariants';
import { useCreateAttempt } from '../hooks/useAttempts';
import Loading from '../components/common/Loading';
import Icon from '../components/common/Icon';
import { getScaleOptions } from '../utils/scaleRecipe';
import type { ItemUsage } from '@proofed/shared';

interface ItemUsageInput extends ItemUsage {
  _key: string;
}

export default function NewAttemptPage() {
  const navigate = useNavigate();
  const { data: items, isLoading: itemsLoading } = useItems();
  const createAttempt = useCreateAttempt();

  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [itemUsages, setItemUsages] = useState<ItemUsageInput[]>([]);

  const addItemUsage = () => {
    setItemUsages([
      ...itemUsages,
      { _key: Date.now().toString(), itemId: '', recipeId: '' },
    ]);
  };

  const updateItemUsage = (key: string, updates: Partial<ItemUsageInput>) => {
    setItemUsages(
      itemUsages.map((usage) =>
        usage._key === key ? { ...usage, ...updates } : usage
      )
    );
  };

  const removeItemUsage = (key: string) => {
    setItemUsages(itemUsages.filter((usage) => usage._key !== key));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validUsages = itemUsages
      .filter((u) => u.itemId && u.recipeId)
      .map(({ _key, ...usage }) => usage);

    createAttempt.mutate(
      {
        name,
        date,
        itemUsages: validUsages,
        notes: notes || undefined,
      },
      {
        onSuccess: (attempt) => navigate(`/attempts/${attempt.attemptId}`),
      }
    );
  };

  if (itemsLoading) return <Loading />;

  const isValid = name.trim() && !createAttempt.isPending;

  return (
    <div className="min-h-screen bg-bg-light">
      {/* Top App Bar */}
      <div className="sticky top-0 z-10 flex items-center bg-bg-light/95 backdrop-blur-md p-4 pb-2 justify-between border-b border-black/5">
        <Link to="/attempts" className="text-primary flex size-12 shrink-0 items-center justify-start">
          <Icon name="close" size="lg" />
        </Link>
        <h2 className="text-[#171112] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          Log Attempt
        </h2>
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className={`text-base font-bold leading-normal tracking-[0.015em] shrink-0 ${
            isValid ? 'text-primary' : 'text-dusty-mauve/50'
          }`}
        >
          Save
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pb-32">
        {/* Basic Info Section */}
        <div className="pt-4">
          <h3 className="section-title px-4 pb-2">Basic Info</h3>

          <div className="px-4 py-3">
            <label className="flex flex-col">
              <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Attempt Name</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Vanilla Cake Test #1"
                className="w-full rounded-xl border border-black/10 bg-white h-14 px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </label>
          </div>

          <div className="px-4 py-3">
            <label className="flex flex-col">
              <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Date</p>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white h-14 px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </label>
          </div>
        </div>

        {/* Items Used Section */}
        <div className="mt-4">
          <div className="flex items-center justify-between px-4 pb-2">
            <h3 className="section-title">Items Used</h3>
            <button
              type="button"
              onClick={addItemUsage}
              className="text-primary text-sm font-bold"
            >
              + Add
            </button>
          </div>

          <div className="px-4 space-y-3">
            {itemUsages.map((usage) => (
              <ItemUsageRow
                key={usage._key}
                usage={usage}
                items={items || []}
                onUpdate={(updates) => updateItemUsage(usage._key, updates)}
                onRemove={() => removeItemUsage(usage._key)}
              />
            ))}

            {itemUsages.length === 0 && (
              <button
                type="button"
                onClick={addItemUsage}
                className="w-full py-8 rounded-xl border-2 border-dashed border-pastel-pink bg-pastel-pink/10 flex flex-col items-center justify-center"
              >
                <Icon name="add_circle" size="lg" className="text-dusty-mauve mb-2" />
                <p className="text-dusty-mauve font-medium text-sm">Add items from your library</p>
              </button>
            )}
          </div>
        </div>

      </form>

      {/* Footer Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg-light border-t border-black/5 pb-safe">
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={!isValid}
          className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
            isValid
              ? 'bg-primary text-white shadow-primary/20'
              : 'bg-dusty-mauve/30 text-dusty-mauve'
          }`}
        >
          <Icon name="save" />
          Create Attempt
        </button>
      </div>
    </div>
  );
}

function ItemUsageRow({
  usage,
  items,
  onUpdate,
  onRemove,
}: {
  usage: ItemUsageInput;
  items: { itemId: string; name: string }[];
  onUpdate: (updates: Partial<ItemUsageInput>) => void;
  onRemove: () => void;
}) {
  const { data: recipes } = useRecipes(usage.itemId);
  const { data: variants } = useVariants(usage.itemId, usage.recipeId);

  return (
    <div className="bg-white rounded-xl border border-black/5 p-4 shadow-sm">
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Item</p>
            <select
              value={usage.itemId}
              onChange={(e) => onUpdate({ itemId: e.target.value, recipeId: '', variantId: undefined })}
              className="w-full rounded-xl border border-black/10 bg-bg-light h-12 px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="">Select item...</option>
              {items.map((i) => (
                <option key={i.itemId} value={i.itemId}>{i.name}</option>
              ))}
            </select>
          </div>

          {usage.itemId && (
            <div>
              <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Recipe</p>
              <select
                value={usage.recipeId}
                onChange={(e) => onUpdate({ recipeId: e.target.value, variantId: undefined })}
                className="w-full rounded-xl border border-black/10 bg-bg-light h-12 px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">Select recipe...</option>
                {(recipes || []).map((r) => (
                  <option key={r.recipeId} value={r.recipeId}>{r.name}</option>
                ))}
              </select>
            </div>
          )}

          {usage.recipeId && variants && variants.length > 0 && (
            <div>
              <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Variant (optional)</p>
              <select
                value={usage.variantId || ''}
                onChange={(e) => onUpdate({ variantId: e.target.value || undefined })}
                className="w-full rounded-xl border border-black/10 bg-bg-light h-12 px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">Base recipe</option>
                {variants.map((v) => (
                  <option key={v.variantId} value={v.variantId}>{v.name}</option>
                ))}
              </select>
            </div>
          )}

          {usage.recipeId && (
            <div>
              <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Scale</p>
              <div className="flex gap-1 flex-wrap">
                {getScaleOptions(recipes?.find(r => r.recipeId === usage.recipeId)?.customScales).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onUpdate({ scaleFactor: option.value === 1 ? undefined : option.value })}
                    className={`px-3 py-2 text-sm font-bold rounded-lg transition-colors ${
                      (usage.scaleFactor ?? 1) === option.value
                        ? 'bg-primary text-white'
                        : 'bg-bg-light text-dusty-mauve hover:bg-pastel-pink'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Notes for this item</p>
            <textarea
              value={usage.notes || ''}
              onChange={(e) => onUpdate({ notes: e.target.value || undefined })}
              placeholder="Any specific notes..."
              rows={2}
              className="w-full rounded-xl border border-black/10 bg-bg-light p-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-dusty-mauve hover:text-primary transition-colors"
        >
          <Icon name="close" />
        </button>
      </div>
    </div>
  );
}
