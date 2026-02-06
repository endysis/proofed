import type { Ingredient, Recipe, Variant } from '@proofed/shared';

/**
 * Merge ingredients from recipe and variant overrides.
 * Variant overrides replace base recipe ingredients with the same name,
 * and any new ingredients from the variant are appended.
 */
export function mergeIngredients(recipe: Recipe, variant?: Variant | null): Ingredient[] {
  if (!variant) {
    return recipe.ingredients;
  }

  const overrideMap = new Map<string, Ingredient>();
  variant.ingredientOverrides.forEach((ing) => overrideMap.set(ing.name, ing));

  const merged: Ingredient[] = [];

  // Start with base recipe ingredients, applying overrides
  recipe.ingredients.forEach((ing) => {
    const override = overrideMap.get(ing.name);
    if (override) {
      merged.push(override);
      overrideMap.delete(ing.name);
    } else {
      merged.push(ing);
    }
  });

  // Add any new ingredients from variant not in base
  overrideMap.forEach((ing) => {
    merged.push(ing);
  });

  return merged;
}
