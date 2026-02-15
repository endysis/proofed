import { useQueries } from '@tanstack/react-query';
import { itemsApi, recipesApi, variantsApi } from '../api/client';
import { scaleIngredients } from '../utils/scaleRecipe';
import type { ItemUsage, Ingredient, ItemType } from '@proofed/shared';

export interface ItemUsageDetail {
  itemName: string;
  itemType: ItemType;
  recipeName: string;
  variantName?: string;
  scaleFactor: number;
  ingredients: Ingredient[];
  baseIngredients: Ingredient[];
  bakeTime?: number;
  bakeTemp?: number;
  bakeTempUnit?: 'F' | 'C';
}

export function useItemUsageDetails(itemUsages: ItemUsage[]) {
  // Create queries for all items, recipes, and variants
  const itemQueries = useQueries({
    queries: itemUsages.map((usage) => ({
      queryKey: ['items', usage.itemId],
      queryFn: () => itemsApi.get(usage.itemId),
      enabled: !!usage.itemId,
    })),
  });

  const recipeQueries = useQueries({
    queries: itemUsages.map((usage) => ({
      queryKey: ['recipes', usage.itemId, usage.recipeId],
      queryFn: () => recipesApi.get(usage.itemId, usage.recipeId),
      enabled: !!usage.itemId && !!usage.recipeId,
    })),
  });

  const variantQueries = useQueries({
    queries: itemUsages.map((usage) => ({
      queryKey: ['variants', usage.itemId, usage.recipeId, usage.variantId],
      queryFn: () => variantsApi.get(usage.itemId, usage.recipeId, usage.variantId!),
      enabled: !!usage.itemId && !!usage.recipeId && !!usage.variantId,
    })),
  });

  const isLoading =
    itemQueries.some((q) => q.isLoading) ||
    recipeQueries.some((q) => q.isLoading) ||
    variantQueries.some((q) => q.isLoading && itemUsages[variantQueries.indexOf(q)]?.variantId);

  const details: ItemUsageDetail[] = itemUsages.map((usage, index) => {
    const item = itemQueries[index]?.data;
    const recipe = recipeQueries[index]?.data;
    const variant = variantQueries[index]?.data;
    const scaleFactor = usage.scaleFactor ?? 1;

    // Get base ingredients from recipe, apply variant overrides if present
    let baseIngredients = recipe?.ingredients || [];
    if (variant?.ingredientOverrides && variant.ingredientOverrides.length > 0) {
      // Variant overrides completely replace recipe ingredients
      baseIngredients = variant.ingredientOverrides;
    }

    // Scale ingredients for display
    const scaledIngredients = scaleIngredients(baseIngredients, scaleFactor);

    // Get bake time/temp (variant overrides recipe)
    const bakeTime = variant?.bakeTime ?? recipe?.bakeTime;
    const bakeTemp = variant?.bakeTemp ?? recipe?.bakeTemp;
    const bakeTempUnit = variant?.bakeTempUnit ?? recipe?.bakeTempUnit;

    return {
      itemName: item?.name || 'Unknown Item',
      itemType: item?.type || 'other',
      recipeName: recipe?.name || 'Unknown Recipe',
      variantName: variant?.name,
      scaleFactor,
      ingredients: scaledIngredients,
      baseIngredients,
      bakeTime,
      bakeTemp,
      bakeTempUnit,
    };
  });

  return {
    details,
    isLoading,
  };
}
