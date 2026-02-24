import type { Ingredient } from '@proofed/shared';

// Sugar-containing ingredients and their keywords
const SUGAR_KEYWORDS = [
  'sugar',
  'caster sugar',
  'granulated sugar',
  'brown sugar',
  'light brown sugar',
  'dark brown sugar',
  'icing sugar',
  'powdered sugar',
  'confectioners sugar',
  'muscovado',
  'demerara',
  'turbinado',
];

// Liquid sugars with approximate sugar content per 100g
const LIQUID_SUGARS: Record<string, number> = {
  honey: 0.82, // ~82% sugar
  'maple syrup': 0.67, // ~67% sugar
  'golden syrup': 0.73, // ~73% sugar
  treacle: 0.73, // ~73% sugar
  'black treacle': 0.65, // ~65% sugar
  molasses: 0.75, // ~75% sugar
  'corn syrup': 0.78, // ~78% sugar
  agave: 0.76, // ~76% sugar
  'agave syrup': 0.76,
  'agave nectar': 0.76,
};

// Unit conversions to grams
const UNIT_TO_GRAMS: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  oz: 28.35,
  ounce: 28.35,
  lb: 453.6,
  pound: 453.6,
  // Volume conversions (approximate for sugar)
  cup: 200, // ~200g granulated sugar per cup
  cups: 200,
  tbsp: 12.5, // ~12.5g sugar per tablespoon
  tablespoon: 12.5,
  tsp: 4, // ~4g sugar per teaspoon
  teaspoon: 4,
  ml: 1, // For liquid sugars, 1ml ≈ 1g
  L: 1000,
};

// Normalize ingredient name for matching
function normalizeIngredientName(name: string): string {
  return name.toLowerCase().trim();
}

// Check if an ingredient is a pure sugar
function isSugar(ingredientName: string): boolean {
  const normalized = normalizeIngredientName(ingredientName);
  return SUGAR_KEYWORDS.some(
    (keyword) => normalized === keyword || normalized.includes(keyword)
  );
}

// Check if an ingredient is a liquid sugar and return its sugar ratio
function getLiquidSugarRatio(ingredientName: string): number | null {
  const normalized = normalizeIngredientName(ingredientName);
  for (const [keyword, ratio] of Object.entries(LIQUID_SUGARS)) {
    if (normalized === keyword || normalized.includes(keyword)) {
      return ratio;
    }
  }
  return null;
}

// Convert quantity + unit to grams
function convertToGrams(quantity: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase().trim();
  const conversionFactor = UNIT_TO_GRAMS[normalizedUnit];

  if (conversionFactor) {
    return quantity * conversionFactor;
  }

  // For unknown units, assume grams if it looks like a weight amount
  // or return the quantity as-is for "unit" type measurements
  if (normalizedUnit === 'unit' || normalizedUnit === '') {
    return 0; // Can't determine sugar from "2 eggs" etc.
  }

  // Default: assume grams
  return quantity;
}

/**
 * Extract total sugar content in grams from a list of ingredients
 *
 * @param ingredients - Array of ingredients
 * @param scaleFactor - Scale factor to apply (default 1)
 * @returns Total sugar in grams
 */
export function extractTotalSugar(
  ingredients: Ingredient[],
  scaleFactor: number = 1
): number {
  let totalSugarGrams = 0;

  for (const ingredient of ingredients) {
    const scaledQuantity = ingredient.quantity * scaleFactor;
    const grams = convertToGrams(scaledQuantity, ingredient.unit);

    // Check if it's a pure sugar ingredient
    if (isSugar(ingredient.name)) {
      totalSugarGrams += grams;
      continue;
    }

    // Check if it's a liquid sugar
    const liquidSugarRatio = getLiquidSugarRatio(ingredient.name);
    if (liquidSugarRatio !== null) {
      totalSugarGrams += grams * liquidSugarRatio;
    }
  }

  return Math.round(totalSugarGrams * 10) / 10; // Round to 1 decimal place
}

/**
 * Extract total sugar from multiple item usages
 *
 * @param itemUsages - Array of item usages with ingredients and scale factors
 * @returns Total sugar in grams
 */
export function extractTotalSugarFromUsages(
  itemUsages: Array<{
    ingredients: Ingredient[];
    scaleFactor: number;
  }>
): number {
  return itemUsages.reduce((total, usage) => {
    return total + extractTotalSugar(usage.ingredients, usage.scaleFactor);
  }, 0);
}
