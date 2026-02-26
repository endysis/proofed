import { useMutation } from '@tanstack/react-query';
import { useMemo, useState, useCallback } from 'react';
import { nutritionApi } from '../api/client';
import { extractTotalSugarFromUsages } from '../utils/nutritionCalculator';
import { estimateTotalServings } from '../utils/servingsEstimator';
import type {
  Ingredient,
  ContainerInfo,
  NutritionInfo,
  CalorieEstimateRequest,
} from '@proofed/shared';

export interface ItemNutritionInput {
  ingredients: Ingredient[];
  scaleFactor: number;
  containerInfo?: ContainerInfo;
}

export interface UseNutritionEstimateResult {
  nutrition: NutritionInfo | null;
  isLoading: boolean;
  needsContainerInfo: boolean;
  error: Error | null;
  calculateNutrition: (overrideContainerInfo?: ContainerInfo) => void;
}

/**
 * Hook for estimating nutrition info (calories, sugar per serving)
 *
 * Sugar is calculated client-side from ingredients.
 * Calories are estimated via AI API call.
 * Servings are estimated from container info.
 *
 * @param itemUsages - Array of item usages with ingredients, scale factors, and optional container info
 * @returns Nutrition estimate result with loading/error states and trigger function
 */
export function useNutritionEstimate(
  itemUsages: ItemNutritionInput[]
): UseNutritionEstimateResult {
  const [nutrition, setNutrition] = useState<NutritionInfo | null>(null);
  const [overrideContainer, setOverrideContainer] = useState<ContainerInfo | null>(null);

  // Check if any item has container info
  const hasContainerInfo = useMemo(() => {
    return (
      overrideContainer !== null ||
      itemUsages.some((usage) => usage.containerInfo !== undefined)
    );
  }, [itemUsages, overrideContainer]);

  // Calculate total sugar client-side (no API needed)
  const totalSugar = useMemo(() => {
    return extractTotalSugarFromUsages(itemUsages);
  }, [itemUsages]);

  // Estimate total servings from container info
  const totalServings = useMemo(() => {
    if (overrideContainer) {
      // Use override container with average scale factor
      const avgScaleFactor =
        itemUsages.length > 0
          ? itemUsages.reduce((sum, u) => sum + u.scaleFactor, 0) / itemUsages.length
          : 1;
      return estimateTotalServings([
        { containerInfo: overrideContainer, scaleFactor: avgScaleFactor },
      ]);
    }

    // Use containers from item usages
    const containersWithScale = itemUsages
      .filter((u) => u.containerInfo)
      .map((u) => ({
        containerInfo: u.containerInfo!,
        scaleFactor: u.scaleFactor,
      }));

    if (containersWithScale.length === 0) {
      return 12; // Default fallback
    }

    return estimateTotalServings(containersWithScale);
  }, [itemUsages, overrideContainer]);

  // Build scaled ingredients list for calorie API
  const scaledIngredients = useMemo(() => {
    const allIngredients: Array<{ name: string; quantity: number; unit: string }> = [];

    for (const usage of itemUsages) {
      for (const ingredient of usage.ingredients) {
        allIngredients.push({
          name: ingredient.name,
          quantity: ingredient.quantity * usage.scaleFactor,
          unit: ingredient.unit,
        });
      }
    }

    return allIngredients;
  }, [itemUsages]);

  // Mutation for calorie estimation
  const calorieMutation = useMutation<
    { totalCalories: number },
    Error,
    CalorieEstimateRequest
  >({
    mutationFn: (request) => {
      console.log('[Nutrition] Calling API with:', JSON.stringify(request));
      return nutritionApi.estimateCalories(request);
    },
    onSuccess: (data) => {
      console.log('[Nutrition] API success:', data);
      const totalCalories = data.totalCalories;
      setNutrition({
        totalCalories,
        totalSugar,
        totalServings,
        caloriesPerServing: Math.round(totalCalories / totalServings),
        sugarPerServing: Math.round((totalSugar / totalServings) * 10) / 10,
      });
    },
    onError: (error) => {
      console.error('[Nutrition] API error:', error);
    },
  });

  // Trigger function to calculate nutrition
  const calculateNutrition = useCallback(
    (containerOverride?: ContainerInfo) => {
      if (containerOverride) {
        setOverrideContainer(containerOverride);
      }

      // Call API for calorie estimation
      calorieMutation.mutate({ ingredients: scaledIngredients });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scaledIngredients]
  );

  return {
    nutrition,
    isLoading: calorieMutation.isPending,
    needsContainerInfo: !hasContainerInfo,
    error: calorieMutation.error,
    calculateNutrition,
  };
}
