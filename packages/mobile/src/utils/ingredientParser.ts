import { UNIT_PRESETS } from '../constants/units';

export interface ParsedIngredient {
  name: string;
  quantity: number;
  unit: string;
  originalLine: string;
}

// Unicode fraction map
const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 0.25,
  '¾': 0.75,
  '⅕': 0.2,
  '⅖': 0.4,
  '⅗': 0.6,
  '⅘': 0.8,
  '⅙': 1 / 6,
  '⅚': 5 / 6,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};

// Known units for matching (lowercase)
const KNOWN_UNITS = new Set([
  ...UNIT_PRESETS.map((u) => u.value.toLowerCase()),
  // Additional common abbreviations
  'gram',
  'grams',
  'kilogram',
  'kilograms',
  'ounce',
  'ounces',
  'pound',
  'pounds',
  'liter',
  'liters',
  'litre',
  'litres',
  'milliliter',
  'milliliters',
  'millilitre',
  'millilitres',
  'teaspoon',
  'teaspoons',
  'tablespoon',
  'tablespoons',
  'cups',
]);

// Size words that act as units
const SIZE_UNITS = new Set(['large', 'medium', 'small', 'extra-large', 'xl']);

// Normalize unit to preset value
function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase();

  const normalizations: Record<string, string> = {
    gram: 'g',
    grams: 'g',
    kilogram: 'kg',
    kilograms: 'kg',
    ounce: 'oz',
    ounces: 'oz',
    pound: 'lb',
    pounds: 'lb',
    liter: 'L',
    liters: 'L',
    litre: 'L',
    litres: 'L',
    milliliter: 'ml',
    milliliters: 'ml',
    millilitre: 'ml',
    millilitres: 'ml',
    teaspoon: 'tsp',
    teaspoons: 'tsp',
    tablespoon: 'tbsp',
    tablespoons: 'tbsp',
    cups: 'cup',
  };

  return normalizations[lower] || unit;
}

// Parse a fraction string like "1/4" to a number
function parseFraction(str: string): number | null {
  const match = str.match(/^(\d+)\/(\d+)$/);
  if (match) {
    const [, num, denom] = match;
    const denomValue = parseInt(denom, 10);
    if (denomValue === 0) return null;
    return parseInt(num, 10) / denomValue;
  }
  return null;
}

// Parse quantity from beginning of string, returns [quantity, remainingString]
function parseQuantity(input: string): [number, string] {
  let str = input.trim();
  let quantity = 0;

  // Check for unicode fraction at start
  const firstChar = str[0];
  if (UNICODE_FRACTIONS[firstChar]) {
    quantity = UNICODE_FRACTIONS[firstChar];
    str = str.slice(1).trim();

    // Check if there's a whole number before (e.g., "1½")
    // This case is handled below
  }

  // Match patterns:
  // - "1.5" (decimal)
  // - "1/4" (fraction)
  // - "1 1/2" (mixed number)
  // - "1½" (whole + unicode fraction)
  // - "600g" (number stuck to unit)
  const decimalMatch = str.match(/^(\d+\.?\d*)/);
  if (decimalMatch) {
    const numStr = decimalMatch[1];
    const afterNum = str.slice(numStr.length);

    // Check for unicode fraction immediately after
    if (UNICODE_FRACTIONS[afterNum[0]]) {
      quantity = parseFloat(numStr) + UNICODE_FRACTIONS[afterNum[0]];
      str = afterNum.slice(1).trim();
      return [quantity, str];
    }

    // Check for fraction after space: "1 1/2"
    const mixedMatch = afterNum.match(/^\s+(\d+\/\d+)/);
    if (mixedMatch) {
      const fractionValue = parseFraction(mixedMatch[1]);
      if (fractionValue !== null) {
        quantity = parseFloat(numStr) + fractionValue;
        str = afterNum.slice(mixedMatch[0].length).trim();
        return [quantity, str];
      }
    }

    // Check for standalone fraction: "1/4"
    const fractionMatch = str.match(/^(\d+\/\d+)/);
    if (fractionMatch && fractionMatch[1] === str.slice(0, fractionMatch[1].length)) {
      const fractionValue = parseFraction(fractionMatch[1]);
      if (fractionValue !== null) {
        quantity = fractionValue;
        str = str.slice(fractionMatch[1].length).trim();
        return [quantity, str];
      }
    }

    // Plain decimal
    quantity = parseFloat(numStr);
    str = afterNum.trim();
    return [quantity, str];
  }

  // Standalone unicode fraction already handled at start
  if (quantity > 0) {
    return [quantity, str];
  }

  return [0, str];
}

// Parse a single line into an ingredient
function parseLine(line: string): ParsedIngredient | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const [quantity, afterQuantity] = parseQuantity(trimmed);

  if (!afterQuantity) {
    // Just a number, no name
    return null;
  }

  let unit = '';
  let name = afterQuantity;

  // Check if unit is stuck to quantity (e.g., "600g Self Raising Flour")
  // Pattern: letters immediately at start that form a known unit
  const stuckUnitMatch = afterQuantity.match(/^([a-zA-Z]+)\s+(.+)/);
  if (stuckUnitMatch) {
    const potentialUnit = stuckUnitMatch[1];
    if (KNOWN_UNITS.has(potentialUnit.toLowerCase())) {
      unit = normalizeUnit(potentialUnit);
      name = stuckUnitMatch[2];
    }
  }

  // If no stuck unit, check first word for unit
  if (!unit) {
    const words = afterQuantity.split(/\s+/);
    if (words.length > 1) {
      const firstWord = words[0];

      // Check if it's a known unit
      if (KNOWN_UNITS.has(firstWord.toLowerCase())) {
        unit = normalizeUnit(firstWord);
        name = words.slice(1).join(' ');
      }
      // Check if it's a size unit (large, medium, small)
      else if (SIZE_UNITS.has(firstWord.toLowerCase())) {
        unit = firstWord.toLowerCase();
        name = words.slice(1).join(' ');
      }
    }
  }

  // Clean up name - remove trailing commas and modifiers like "Softened"
  // Keep them as part of the name since they may be relevant
  name = name.trim();

  // Capitalize each word in the ingredient name
  name = name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // If we still have no unit but have a quantity, default to 'unit'
  if (quantity > 0 && !unit) {
    unit = 'unit';
  }

  return {
    name,
    quantity,
    unit,
    originalLine: trimmed,
  };
}

// Parse multiple lines of ingredients
export function parseIngredients(text: string): ParsedIngredient[] {
  const lines = text.split('\n');
  const results: ParsedIngredient[] = [];

  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed && parsed.name) {
      results.push(parsed);
    }
  }

  return results;
}
