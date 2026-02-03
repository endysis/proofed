import type { Ingredient } from '@proofed/shared';

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
export const SCALE_PRESETS = [
  { value: 0.5, label: '÷2' },
  { value: 1, label: '1×' },
  { value: 1.5, label: '×1.5' },
  { value: 2, label: '×2' },
] as const;
