import { useMemo, useState, useCallback } from 'react';
import {
  extractTotalSugarFromUsages,
  estimateTotalCaloriesFromUsages,
  calculateStoreBoughtNutrition,
} from '../utils/nutritionCalculator';
import type { Ingredient, NutritionInfo } from '@proofed/shared';

export interface ItemNutritionInput {
  ingredients: Ingredient[];
  scaleFactor: number;
  // Store-bought fields
  isStoreBought?: boolean;
  usageQuantity?: number;
  usageUnit?: string;
  energyKcal100g?: number;
  sugars100g?: number;
}

export interface UseNutritionEstimateResult {
  nutrition: NutritionInfo | null;
  totalCalories: number;
  totalSugar: number;
  calculateNutrition: (sliceCount: number) => void;
  recalculate: (sliceCount: number) => void;
}

/**
 * Hook for estimating nutrition info (calories, sugar per serving)
 *
 * Both sugar and calories are calculated client-side from ingredients.
 * User provides the slice count manually.
 *
 * @param itemUsages - Array of item usages with ingredients and scale factors
 * @returns Nutrition estimate result with trigger function
 */
export function useNutritionEstimate(
  itemUsages: ItemNutritionInput[]
): UseNutritionEstimateResult {
  const [nutrition, setNutrition] = useState<NutritionInfo | null>(null);

  // Calculate total sugar and calories client-side (accounts for scale factors)
  // Now includes both homemade ingredients and store-bought products
  const { totalSugar, totalCalories } = useMemo(() => {
    // Separate homemade and store-bought items
    const homemadeItems = itemUsages.filter(
      (item) => !item.isStoreBought && item.ingredients.length > 0
    );
    const storeBoughtItems = itemUsages.filter(
      (item) => item.isStoreBought && item.usageQuantity && item.usageQuantity > 0
    );

    // Calculate nutrition from homemade items
    const homemadeSugar = extractTotalSugarFromUsages(homemadeItems);
    const homemadeCalories = estimateTotalCaloriesFromUsages(homemadeItems);

    // Calculate nutrition from store-bought items
    let storeBoughtSugar = 0;
    let storeBoughtCalories = 0;

    for (const item of storeBoughtItems) {
      const { calories, sugar } = calculateStoreBoughtNutrition(
        item.usageQuantity!,
        item.usageUnit || 'g',
        item.energyKcal100g,
        item.sugars100g
      );
      storeBoughtCalories += calories;
      storeBoughtSugar += sugar;
    }

    return {
      totalSugar: homemadeSugar + storeBoughtSugar,
      totalCalories: homemadeCalories + storeBoughtCalories,
    };
  }, [itemUsages]);

  // Calculate nutrition with given slice count
  const calculateNutrition = useCallback(
    (sliceCount: number) => {
      const servings = Math.max(1, sliceCount); // Minimum 1 slice

      console.log('[Nutrition] Calculating:', {
        totalCalories,
        totalSugar,
        sliceCount: servings,
      });

      setNutrition({
        totalCalories,
        totalSugar,
        totalServings: servings,
        caloriesPerServing: Math.round(totalCalories / servings),
        sugarPerServing: Math.round((totalSugar / servings) * 10) / 10,
      });
    },
    [totalCalories, totalSugar]
  );

  // Alias for recalculating with a new slice count
  const recalculate = calculateNutrition;

  return {
    nutrition,
    totalCalories,
    totalSugar,
    calculateNutrition,
    recalculate,
  };
}
