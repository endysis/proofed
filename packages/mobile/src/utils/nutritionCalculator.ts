import type { Ingredient } from '@proofed/shared';

// =============================================================================
// CALORIE DATA - calories per 100g (or per 100ml for liquids)
// =============================================================================

const CALORIE_DATA: Record<string, number> = {
  // Flours & Starches
  flour: 364,
  'plain flour': 364,
  'all-purpose flour': 364,
  'all purpose flour': 364,
  'self-raising flour': 364,
  'self raising flour': 364,
  'bread flour': 361,
  'cake flour': 362,
  'whole wheat flour': 340,
  'wholemeal flour': 340,
  'almond flour': 571,
  'coconut flour': 443,
  cornflour: 381,
  cornstarch: 381,
  'corn starch': 381,

  // Sugars
  sugar: 387,
  'caster sugar': 387,
  'granulated sugar': 387,
  'white sugar': 387,
  'brown sugar': 380,
  'light brown sugar': 380,
  'dark brown sugar': 380,
  'icing sugar': 389,
  'powdered sugar': 389,
  'confectioners sugar': 389,
  muscovado: 375,
  demerara: 375,

  // Liquid sweeteners
  honey: 304,
  'maple syrup': 260,
  'golden syrup': 325,
  treacle: 290,
  'black treacle': 257,
  molasses: 290,
  'corn syrup': 286,
  agave: 310,

  // Fats
  butter: 717,
  'unsalted butter': 717,
  'salted butter': 717,
  margarine: 717,
  'vegetable oil': 884,
  'sunflower oil': 884,
  'olive oil': 884,
  'coconut oil': 862,
  oil: 884,
  lard: 902,
  shortening: 884,

  // Dairy
  milk: 42,
  'whole milk': 61,
  'semi-skimmed milk': 47,
  'skimmed milk': 35,
  'skim milk': 35,
  cream: 340,
  'heavy cream': 340,
  'double cream': 449,
  'whipping cream': 340,
  'single cream': 193,
  'light cream': 193,
  'sour cream': 193,
  'cream cheese': 342,
  'full-fat cream cheese': 342,
  'mascarpone': 429,
  yogurt: 59,
  'greek yogurt': 97,
  buttermilk: 40,

  // Eggs
  egg: 155,
  eggs: 155,
  'egg white': 52,
  'egg whites': 52,
  'egg yolk': 322,
  'egg yolks': 322,

  // Chocolate & Cocoa
  'cocoa powder': 228,
  cocoa: 228,
  chocolate: 546,
  'dark chocolate': 546,
  'milk chocolate': 535,
  'white chocolate': 539,
  'chocolate chips': 479,

  // Nuts & Seeds
  almonds: 579,
  walnuts: 654,
  pecans: 691,
  hazelnuts: 628,
  peanuts: 567,
  'peanut butter': 588,
  cashews: 553,
  pistachios: 560,
  'desiccated coconut': 660,
  'shredded coconut': 660,
  coconut: 354,

  // Dried Fruits
  raisins: 299,
  sultanas: 299,
  currants: 283,
  'dried cranberries': 308,
  'dried apricots': 241,
  dates: 282,

  // Leavening & Extras
  'baking powder': 53,
  'baking soda': 0,
  'bicarbonate of soda': 0,
  yeast: 105,
  salt: 0,
  'vanilla extract': 288,
  'vanilla essence': 288,
  vanilla: 288,

  // Fresh Fruits (common in baking)
  banana: 89,
  bananas: 89,
  apple: 52,
  apples: 52,
  lemon: 29,
  'lemon juice': 22,
  'lemon zest': 47,
  orange: 47,
  'orange juice': 45,
  'orange zest': 97,
  berries: 57,
  blueberries: 57,
  raspberries: 52,
  strawberries: 32,
};

// Additional unit conversions for calories (some differ from sugar)
const CALORIE_UNIT_TO_GRAMS: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  oz: 28.35,
  ounce: 28.35,
  lb: 453.6,
  pound: 453.6,
  ml: 1, // Approximate for liquids
  L: 1000,
  cup: 240, // Average cup weight varies by ingredient
  cups: 240,
  tbsp: 15,
  tablespoon: 15,
  tsp: 5,
  teaspoon: 5,
};

// Approximate calories per egg (large)
const CALORIES_PER_EGG = 75;

/**
 * Get calories per 100g for an ingredient
 */
function getCaloriesPer100g(ingredientName: string): number | null {
  const normalized = ingredientName.toLowerCase().trim();

  // Direct match
  if (CALORIE_DATA[normalized] !== undefined) {
    return CALORIE_DATA[normalized];
  }

  // Partial match - find the best matching key
  for (const [key, calories] of Object.entries(CALORIE_DATA)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return calories;
    }
  }

  return null;
}

/**
 * Convert quantity + unit to grams for calorie calculation
 */
function convertToGramsForCalories(
  quantity: number,
  unit: string,
  ingredientName: string
): number {
  const normalizedUnit = unit.toLowerCase().trim();
  const normalizedName = ingredientName.toLowerCase().trim();

  // Special handling for eggs counted as units
  if (
    (normalizedName.includes('egg') && !normalizedName.includes('eggnog')) &&
    (normalizedUnit === '' || normalizedUnit === 'unit' || normalizedUnit === 'large' || normalizedUnit === 'medium')
  ) {
    // Return weight equivalent: 1 large egg ≈ 50g
    return quantity * 50;
  }

  const conversionFactor = CALORIE_UNIT_TO_GRAMS[normalizedUnit];
  if (conversionFactor) {
    return quantity * conversionFactor;
  }

  // For unknown units, assume grams
  return quantity;
}

/**
 * Estimate total calories from a list of ingredients
 */
export function estimateTotalCalories(
  ingredients: Ingredient[],
  scaleFactor: number = 1
): number {
  let totalCalories = 0;

  for (const ingredient of ingredients) {
    const scaledQuantity = ingredient.quantity * scaleFactor;
    const grams = convertToGramsForCalories(scaledQuantity, ingredient.unit, ingredient.name);
    const caloriesPer100g = getCaloriesPer100g(ingredient.name);

    if (caloriesPer100g !== null) {
      totalCalories += (grams / 100) * caloriesPer100g;
    } else {
      // Unknown ingredient - estimate conservatively at 200 cal/100g (average)
      totalCalories += (grams / 100) * 200;
    }
  }

  // Round to nearest 10
  return Math.round(totalCalories / 10) * 10;
}

/**
 * Estimate total calories from multiple item usages
 */
export function estimateTotalCaloriesFromUsages(
  itemUsages: Array<{
    ingredients: Ingredient[];
    scaleFactor: number;
  }>
): number {
  return itemUsages.reduce((total, usage) => {
    return total + estimateTotalCalories(usage.ingredients, usage.scaleFactor);
  }, 0);
}

// =============================================================================
// STORE-BOUGHT PRODUCT NUTRITION
// =============================================================================

/**
 * Calculate nutrition from store-bought product usage
 * Uses energyKcal100g and sugars100g from product data
 *
 * @param usageQuantity - how much of the product is used (e.g., 150)
 * @param usageUnit - unit for usage (e.g., "g")
 * @param energyKcal100g - calories per 100g from product data
 * @param sugars100g - sugar grams per 100g from product data
 * @returns Object with calories and sugar, or zeros if data unavailable
 */
export function calculateStoreBoughtNutrition(
  usageQuantity: number,
  usageUnit: string,
  energyKcal100g?: number,
  sugars100g?: number
): { calories: number; sugar: number } {
  if (!usageQuantity || usageQuantity <= 0) {
    return { calories: 0, sugar: 0 };
  }

  // Convert usage quantity to grams
  const grams = convertToGrams(usageQuantity, usageUnit);

  // Calculate nutrition based on grams used
  const calories = energyKcal100g != null
    ? Math.round((grams / 100) * energyKcal100g)
    : 0;

  const sugar = sugars100g != null
    ? Math.round((grams / 100) * sugars100g * 10) / 10
    : 0;

  return { calories, sugar };
}

// =============================================================================
// SUGAR CALCULATION (existing code)
// =============================================================================

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
