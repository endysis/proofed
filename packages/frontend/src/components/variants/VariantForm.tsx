import { useState } from 'react';
import Icon from '../common/Icon';
import type { Variant, Ingredient, CreateVariantRequest } from '@proofed/shared';

const UNIT_PRESETS = [
  // Weight
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'oz', label: 'oz' },
  { value: 'lb', label: 'lb' },
  // Volume
  { value: 'ml', label: 'ml' },
  { value: 'L', label: 'L' },
  { value: 'tsp', label: 'tsp' },
  { value: 'tbsp', label: 'tbsp' },
  { value: 'cup', label: 'cup' },
  { value: 'fl oz', label: 'fl oz' },
  // Count
  { value: 'unit', label: 'unit' },
  { value: 'piece', label: 'piece' },
  { value: 'large', label: 'large' },
  { value: 'medium', label: 'medium' },
  { value: 'small', label: 'small' },
  // Other
  { value: 'pinch', label: 'pinch' },
  { value: 'to taste', label: 'to taste' },
];

interface VariantFormProps {
  variant?: Variant;
  recipeIngredients?: Ingredient[];
  onSubmit: (data: CreateVariantRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function VariantForm({
  variant,
  recipeIngredients = [],
  onSubmit,
  onCancel,
  isLoading,
}: VariantFormProps) {
  const [name, setName] = useState(variant?.name || '');
  const [ingredientOverrides, setIngredientOverrides] = useState<Ingredient[]>(
    variant?.ingredientOverrides || [{ name: '', quantity: 0, unit: '' }]
  );
  const [notes, setNotes] = useState(variant?.notes || '');
  const [customUnits, setCustomUnits] = useState<Record<number, string>>({});

  const isPresetUnit = (unit: string) => UNIT_PRESETS.some(p => p.value === unit);

  const getUnitSelectValue = (_index: number, unit: string) => {
    if (!unit) return '';
    if (isPresetUnit(unit)) return unit;
    return 'other';
  };

  const handleUnitChange = (index: number, value: string) => {
    if (value === 'other') {
      setCustomUnits(prev => ({ ...prev, [index]: '' }));
      updateOverride(index, 'unit', '');
    } else {
      setCustomUnits(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      updateOverride(index, 'unit', value);
    }
  };

  const handleCustomUnitChange = (index: number, value: string) => {
    setCustomUnits(prev => ({ ...prev, [index]: value }));
    updateOverride(index, 'unit', value);
  };

  const handleIngredientSelect = (index: number, ingredientName: string) => {
    if (ingredientName === '') {
      updateOverride(index, 'name', '');
      return;
    }
    const recipeIngredient = recipeIngredients.find(i => i.name === ingredientName);
    if (recipeIngredient) {
      const updated = [...ingredientOverrides];
      updated[index] = { ...recipeIngredient };
      setIngredientOverrides(updated);
      // Clear custom unit state for this index if the unit is a preset
      if (isPresetUnit(recipeIngredient.unit)) {
        setCustomUnits(prev => {
          const next = { ...prev };
          delete next[index];
          return next;
        });
      }
    } else {
      updateOverride(index, 'name', ingredientName);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOverrides = ingredientOverrides.filter((i) => i.name.trim());
    onSubmit({ name, ingredientOverrides: validOverrides, notes: notes || undefined });
  };

  const updateOverride = (index: number, field: keyof Ingredient, value: string | number) => {
    const updated = [...ingredientOverrides];
    updated[index] = { ...updated[index], [field]: value };
    setIngredientOverrides(updated);
  };

  const addOverride = () => {
    setIngredientOverrides([...ingredientOverrides, { name: '', quantity: 0, unit: '' }]);
  };

  const removeOverride = (index: number) => {
    if (ingredientOverrides.length > 1) {
      setIngredientOverrides(ingredientOverrides.filter((_, i) => i !== index));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Variant Name</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., +15% Oil Version"
          required
          autoFocus
          className="w-full rounded-xl border border-black/10 bg-white h-14 px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[#171112] text-sm font-medium leading-normal">Ingredient Overrides</p>
          <p className="text-xs text-dusty-mauve mt-0.5">Only list ingredients that are different</p>
        </div>
        {ingredientOverrides.map((override, index) => (
          <div key={index} className="space-y-2">
            <div className="flex gap-2 items-center">
              {recipeIngredients.length > 0 ? (
                <div className="flex-1">
                  <select
                    value={recipeIngredients.some(i => i.name === override.name) ? override.name : ''}
                    onChange={(e) => handleIngredientSelect(index, e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-bg-light h-12 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="">Select ingredient...</option>
                    {recipeIngredients.map((ing) => (
                      <option key={ing.name} value={ing.name}>
                        {ing.name} ({ing.quantity} {ing.unit})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex-1">
                  <input
                    type="text"
                    value={override.name}
                    onChange={(e) => updateOverride(index, 'name', e.target.value)}
                    placeholder="Ingredient"
                    className="w-full rounded-xl border border-black/10 bg-bg-light h-12 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeOverride(index)}
                className="p-2 text-dusty-mauve active:text-primary flex-shrink-0"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>
            {override.name && (
              <div className="flex gap-2 items-center pl-2">
                <span className="text-xs text-dusty-mauve w-16 truncate">{override.name}</span>
                <div className="w-16">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={override.quantity || ''}
                    onChange={(e) => updateOverride(index, 'quantity', parseFloat(e.target.value) || 0)}
                    placeholder="Qty"
                    className="w-full rounded-xl border border-black/10 bg-bg-light h-10 px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div className="w-20">
                  <select
                    value={getUnitSelectValue(index, override.unit)}
                    onChange={(e) => handleUnitChange(index, e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-bg-light h-10 px-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                  >
                    <option value="">Unit</option>
                    {UNIT_PRESETS.map((unit) => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                    <option value="other">Other</option>
                  </select>
                </div>
                {(customUnits[index] !== undefined || (!isPresetUnit(override.unit) && override.unit)) && (
                  <div className="w-16">
                    <input
                      type="text"
                      value={customUnits[index] ?? override.unit}
                      onChange={(e) => handleCustomUnitChange(index, e.target.value)}
                      placeholder="Custom"
                      className="w-full rounded-xl border border-black/10 bg-bg-light h-10 px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addOverride}
          className="w-full py-3 text-primary font-bold active:bg-primary/5 rounded-xl border-2 border-dashed border-pastel-pink flex items-center justify-center gap-2"
        >
          <Icon name="add" size="sm" />
          Add Override
        </button>
      </div>

      <div>
        <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Notes</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What's different and why"
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
          {variant ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
