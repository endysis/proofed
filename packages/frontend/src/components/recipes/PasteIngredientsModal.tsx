import { useState } from 'react';
import Icon from '../common/Icon';
import { parseIngredients, ParsedIngredient } from '../../utils/ingredientParser';
import { UNIT_PRESETS } from '../../constants/units';
import type { Ingredient } from '@proofed/shared';

interface PasteIngredientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (ingredients: Ingredient[]) => void;
}

export default function PasteIngredientsModal({
  isOpen,
  onClose,
  onAdd,
}: PasteIngredientsModalProps) {
  const [rawText, setRawText] = useState('');
  const [parsedIngredients, setParsedIngredients] = useState<ParsedIngredient[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen) return null;

  const handleParse = () => {
    const parsed = parseIngredients(rawText);
    setParsedIngredients(parsed);
    setShowPreview(true);
  };

  const handleAdd = () => {
    const ingredients: Ingredient[] = parsedIngredients.map((p) => ({
      name: p.name,
      quantity: p.quantity,
      unit: p.unit,
    }));
    onAdd(ingredients);
    handleClose();
  };

  const handleClose = () => {
    setRawText('');
    setParsedIngredients([]);
    setShowPreview(false);
    onClose();
  };

  const updateParsedIngredient = (
    index: number,
    field: keyof ParsedIngredient,
    value: string | number
  ) => {
    setParsedIngredients((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeParsedIngredient = (index: number) => {
    setParsedIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const isPresetUnit = (unit: string) => UNIT_PRESETS.some((p) => p.value === unit);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col mb-16">
        <div className="flex items-center justify-between p-4 border-b border-black/10">
          <h2 className="text-lg font-bold text-[#171112]">Paste Ingredients</h2>
          <button onClick={handleClose} className="p-2 text-dusty-mauve active:text-primary">
            <Icon name="close" size="sm" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!showPreview ? (
            <>
              <p className="text-sm text-dusty-mauve">
                Paste your ingredient list below, one ingredient per line.
              </p>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Example:
600g Self Raising Flour
1/4 tsp Sea Salt
180g Buttermilk
1.5tsp Vanilla Extract
9 Large Eggs
420g Unsalted Butter, Softened`}
                rows={10}
                autoFocus
                className="w-full rounded-xl border border-black/10 bg-bg-light p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none font-mono"
              />
            </>
          ) : (
            <>
              <p className="text-sm text-dusty-mauve">
                Review and edit the parsed ingredients below.
              </p>
              <div className="space-y-3">
                {parsedIngredients.map((ingredient, index) => (
                  <div key={index} className="p-3 bg-bg-light rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs text-dusty-mauve">
                      <span className="truncate">{ingredient.originalLine}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={ingredient.name}
                          onChange={(e) => updateParsedIngredient(index, 'name', e.target.value)}
                          placeholder="Ingredient"
                          className="w-full rounded-lg border border-black/10 bg-white h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                      <div className="w-16">
                        <input
                          type="number"
                          inputMode="decimal"
                          value={ingredient.quantity || ''}
                          onChange={(e) =>
                            updateParsedIngredient(index, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          placeholder="Qty"
                          className="w-full rounded-lg border border-black/10 bg-white h-10 px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                      <div className="w-20">
                        <select
                          value={isPresetUnit(ingredient.unit) ? ingredient.unit : 'other'}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value !== 'other') {
                              updateParsedIngredient(index, 'unit', value);
                            }
                          }}
                          className="w-full rounded-lg border border-black/10 bg-white h-10 px-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                        >
                          <option value="">Unit</option>
                          {UNIT_PRESETS.map((unit) => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label}
                            </option>
                          ))}
                          <option value="other">Other</option>
                        </select>
                      </div>
                      {!isPresetUnit(ingredient.unit) && ingredient.unit && (
                        <div className="w-16">
                          <input
                            type="text"
                            value={ingredient.unit}
                            onChange={(e) => updateParsedIngredient(index, 'unit', e.target.value)}
                            placeholder="Custom"
                            className="w-full rounded-lg border border-black/10 bg-white h-10 px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeParsedIngredient(index)}
                        className="p-2 text-dusty-mauve active:text-primary flex-shrink-0"
                      >
                        <Icon name="close" size="sm" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {parsedIngredients.length === 0 && (
                <p className="text-center text-dusty-mauve py-8">
                  No ingredients could be parsed. Try a different format.
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex gap-3 p-4 pb-safe border-t border-black/10">
          {!showPreview ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl border border-black/10 font-bold text-[#171112]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParse}
                disabled={!rawText.trim()}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-50"
              >
                Parse
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="flex-1 py-3 rounded-xl border border-black/10 font-bold text-[#171112]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={parsedIngredients.length === 0}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-50"
              >
                Add {parsedIngredients.length} Ingredient{parsedIngredients.length !== 1 ? 's' : ''}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
