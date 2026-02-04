import { useState } from 'react';
import Icon from '../common/Icon';
import PasteIngredientsModal from './PasteIngredientsModal';
import { UNIT_PRESETS } from '../../constants/units';
import { CONTAINER_TYPES, CONTAINER_SIZES } from '../../constants/containers';
import type { Recipe, Ingredient, CreateRecipeRequest, ContainerType } from '@proofed/shared';

interface RecipeFormProps {
  recipe?: Recipe;
  onSubmit: (data: CreateRecipeRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function RecipeForm({
  recipe,
  onSubmit,
  onCancel,
  isLoading,
}: RecipeFormProps) {
  const [name, setName] = useState(recipe?.name || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients || [{ name: '', quantity: 0, unit: '' }]
  );
  const [prepNotes, setPrepNotes] = useState(recipe?.prepNotes || '');
  const [bakeTime, setBakeTime] = useState<number | ''>(recipe?.bakeTime ?? '');
  const [bakeTemp, setBakeTemp] = useState<number | ''>(recipe?.bakeTemp ?? '');
  const [bakeTempUnit, setBakeTempUnit] = useState<'F' | 'C'>(recipe?.bakeTempUnit ?? 'F');
  const [customScales, setCustomScales] = useState<string>(
    recipe?.customScales?.join(', ') || ''
  );
  const [customUnits, setCustomUnits] = useState<Record<number, string>>({});
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [hasContainer, setHasContainer] = useState(!!recipe?.container);
  const [containerType, setContainerType] = useState<ContainerType>(recipe?.container?.type ?? 'round_cake_tin');
  const [containerSize, setContainerSize] = useState<number>(recipe?.container?.size ?? 8);
  const [containerCount, setContainerCount] = useState<number | ''>(recipe?.container?.count ?? 1);

  const isPresetUnit = (unit: string) => UNIT_PRESETS.some(p => p.value === unit);

  const getUnitSelectValue = (_index: number, unit: string) => {
    if (!unit) return '';
    if (isPresetUnit(unit)) return unit;
    return 'other';
  };

  const handleUnitChange = (index: number, value: string) => {
    if (value === 'other') {
      setCustomUnits(prev => ({ ...prev, [index]: '' }));
      updateIngredient(index, 'unit', '');
    } else {
      setCustomUnits(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      updateIngredient(index, 'unit', value);
    }
  };

  const handleCustomUnitChange = (index: number, value: string) => {
    setCustomUnits(prev => ({ ...prev, [index]: value }));
    updateIngredient(index, 'unit', value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validIngredients = ingredients.filter((i) => i.name.trim());
    const parsedCustomScales = customScales
      .split(',')
      .map(s => parseFloat(s.trim()))
      .filter(n => !isNaN(n) && n > 0);
    onSubmit({
      name,
      ingredients: validIngredients,
      prepNotes: prepNotes || undefined,
      bakeTime: bakeTime || undefined,
      bakeTemp: bakeTemp || undefined,
      bakeTempUnit: bakeTemp ? bakeTempUnit : undefined,
      customScales: parsedCustomScales.length > 0 ? parsedCustomScales : undefined,
      container: hasContainer && containerCount ? {
        type: containerType,
        size: containerSize,
        count: containerCount,
      } : undefined,
    });
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: 0, unit: '' }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handlePastedIngredients = (newIngredients: Ingredient[]) => {
    // Filter out empty placeholder ingredients before adding
    const existingNonEmpty = ingredients.filter((i) => i.name.trim());
    setIngredients([...existingNonEmpty, ...newIngredients]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Recipe Name</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Grandma's Recipe"
          required
          autoFocus
          className="w-full rounded-xl border border-black/10 bg-white h-14 px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      <div className="space-y-3">
        <p className="text-[#171112] text-sm font-medium leading-normal">Ingredients</p>
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex gap-2 items-center">
            <div className="flex-1">
              <input
                type="text"
                value={ingredient.name}
                onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                placeholder="Ingredient"
                className="w-full rounded-xl border border-black/10 bg-bg-light h-12 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="w-16">
              <input
                type="number"
                inputMode="decimal"
                value={ingredient.quantity || ''}
                onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                placeholder="Qty"
                className="w-full rounded-xl border border-black/10 bg-bg-light h-12 px-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="w-20">
              <select
                value={getUnitSelectValue(index, ingredient.unit)}
                onChange={(e) => handleUnitChange(index, e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-bg-light h-12 px-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
              >
                <option value="">Unit</option>
                {UNIT_PRESETS.map((unit) => (
                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                ))}
                <option value="other">Other</option>
              </select>
            </div>
            {(customUnits[index] !== undefined || (!isPresetUnit(ingredient.unit) && ingredient.unit)) && (
              <div className="w-16">
                <input
                  type="text"
                  value={customUnits[index] ?? ingredient.unit}
                  onChange={(e) => handleCustomUnitChange(index, e.target.value)}
                  placeholder="Custom"
                  className="w-full rounded-xl border border-black/10 bg-bg-light h-12 px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => removeIngredient(index)}
              className="p-2 text-dusty-mauve active:text-primary flex-shrink-0"
            >
              <Icon name="close" size="sm" />
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addIngredient}
            className="flex-1 py-3 text-primary font-bold active:bg-primary/5 rounded-xl border-2 border-dashed border-pastel-pink flex items-center justify-center gap-2"
          >
            <Icon name="add" size="sm" />
            Add Ingredient
          </button>
          <button
            type="button"
            onClick={() => setShowPasteModal(true)}
            className="py-3 px-4 text-primary font-bold active:bg-primary/5 rounded-xl border-2 border-dashed border-pastel-pink flex items-center justify-center gap-2"
          >
            <Icon name="content_paste" size="sm" />
            Paste
          </button>
        </div>
      </div>

      <div>
        <p className="text-[#171112] text-sm font-medium leading-normal pb-2">
          Bake Settings <span className="text-dusty-mauve font-normal">(optional)</span>
        </p>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-dusty-mauve">Time (min)</label>
            <input
              type="number"
              inputMode="numeric"
              value={bakeTime}
              onChange={(e) => setBakeTime(e.target.value ? parseInt(e.target.value) : '')}
              placeholder="25"
              className="w-full rounded-xl border border-black/10 bg-white h-12 px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-dusty-mauve">Temperature</label>
            <input
              type="number"
              inputMode="numeric"
              value={bakeTemp}
              onChange={(e) => setBakeTemp(e.target.value ? parseInt(e.target.value) : '')}
              placeholder="350"
              className="w-full rounded-xl border border-black/10 bg-white h-12 px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="w-16">
            <label className="text-xs text-dusty-mauve">Unit</label>
            <select
              value={bakeTempUnit}
              onChange={(e) => setBakeTempUnit(e.target.value as 'F' | 'C')}
              className="w-full rounded-xl border border-black/10 bg-white h-12 px-2 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="F">°F</option>
              <option value="C">°C</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[#171112] text-sm font-medium leading-normal pb-2">
          Custom Scales <span className="text-dusty-mauve font-normal">(optional)</span>
        </p>
        <input
          type="text"
          value={customScales}
          onChange={(e) => setCustomScales(e.target.value)}
          placeholder="e.g., 0.75, 1.25, 3"
          className="w-full rounded-xl border border-black/10 bg-white h-12 px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        <p className="text-xs text-dusty-mauve mt-1">Comma-separated scale factors for this recipe</p>
      </div>

      <div>
        <div className="flex items-center justify-between pb-2">
          <p className="text-[#171112] text-sm font-medium leading-normal">
            Container <span className="text-dusty-mauve font-normal">(optional)</span>
          </p>
          <button
            type="button"
            onClick={() => setHasContainer(!hasContainer)}
            className={`w-12 h-7 rounded-full transition-colors ${
              hasContainer ? 'bg-primary' : 'bg-black/20'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mx-1 ${
              hasContainer ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
        {hasContainer && (
          <div className="flex gap-2 items-end">
            <div className="w-16">
              <label className="text-xs text-dusty-mauve">Count</label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={containerCount}
                onChange={(e) => setContainerCount(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full rounded-xl border border-black/10 bg-white h-12 px-3 text-base text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="text-dusty-mauve text-lg font-medium pb-3">×</div>
            <div className="w-20">
              <label className="text-xs text-dusty-mauve">Size</label>
              <select
                value={containerSize}
                onChange={(e) => setContainerSize(parseInt(e.target.value))}
                className="w-full rounded-xl border border-black/10 bg-white h-12 px-2 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                {CONTAINER_SIZES.map(size => (
                  <option key={size} value={size}>{size}"</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-dusty-mauve">Type</label>
              <select
                value={containerType}
                onChange={(e) => setContainerType(e.target.value as ContainerType)}
                className="w-full rounded-xl border border-black/10 bg-white h-12 px-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                {CONTAINER_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Preparation Notes</p>
        <textarea
          value={prepNotes}
          onChange={(e) => setPrepNotes(e.target.value)}
          placeholder="Instructions and tips"
          rows={4}
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
          {recipe ? 'Update' : 'Create'}
        </button>
      </div>

      <PasteIngredientsModal
        isOpen={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        onAdd={handlePastedIngredients}
      />
    </form>
  );
}
