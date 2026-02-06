import type { Ingredient } from '@proofed/shared';

/**
 * Calculate scale factor from a target ingredient amount
 * @param baseAmount - Original recipe amount (e.g., 800g)
 * @param targetAmount - Amount user has (e.g., 678g)
 * @returns Scale factor rounded to 4 decimal places
 */
export function calculateScaleFromIngredient(baseAmount: number, targetAmount: number): number {
  if (baseAmount <= 0) return 1;
  return Math.round((targetAmount / baseAmount) * 10000) / 10000;
}

/**
 * Scale ingredients by a given factor
 */
export function scaleIngredients(ingredients: Ingredient[], scaleFactor: number): Ingredient[] {
  return ingredients.map(ingredient => ({
    ...ingredient,
    quantity: Math.round(ingredient.quantity * scaleFactor * 100) / 100, // Round to 2 decimal places
  }));
}

/**
 * Format scale factor for display
 * Returns "÷2" for 0.5, "×2" for 2, "1×" for 1, etc.
 */
export function formatScaleFactor(scale: number): string {
  if (scale === 1) return '1×';
  if (scale < 1) {
    const divisor = 1 / scale;
    // Check if it's a clean fraction
    if (Number.isInteger(divisor)) {
      return `÷${divisor}`;
    }
    return `×${scale}`;
  }
  return `×${scale}`;
}

/**
 * Available scale presets
 */
export const SCALE_PRESETS: { value: number; label: string }[] = [
  { value: 0.5, label: '÷2' },
  { value: 0.75, label: '×0.75' },
  { value: 1, label: '1×' },
  { value: 1.5, label: '×1.5' },
  { value: 2, label: '×2' },
];

/**
 * Get scale options combining presets with custom scales
 */
export function getScaleOptions(customScales?: number[]): { value: number; label: string }[] {
  const presetValues = new Set(SCALE_PRESETS.map(p => p.value));
  const options = [...SCALE_PRESETS];

  if (customScales) {
    customScales.forEach(scale => {
      if (!presetValues.has(scale)) {
        options.push({ value: scale, label: formatScaleFactor(scale) });
      }
    });
  }

  // Sort by value
  return options.sort((a, b) => a.value - b.value);
}
