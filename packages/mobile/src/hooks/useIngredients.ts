import { useQuery, useMutation } from '@tanstack/react-query';
import { ingredientsApi } from '../api/client';
import type { IngredientSuggestion, SubmitIngredientRequest } from '@proofed/shared';

export function useIngredientSuggestions() {
  return useQuery({
    queryKey: ['ingredients'],
    queryFn: ingredientsApi.list,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days (cache time)
  });
}

export function useSubmitIngredient() {
  return useMutation({
    mutationFn: (data: SubmitIngredientRequest) => ingredientsApi.submit(data),
  });
}

export function filterIngredients(
  ingredients: IngredientSuggestion[],
  query: string,
  limit = 8
): IngredientSuggestion[] {
  if (!query.trim()) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();

  // Filter by prefix match and sort by relevance
  const matches = ingredients
    .filter((ing) => ing.name.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      // Prioritize exact prefix matches
      const aStartsWith = aName.startsWith(normalizedQuery);
      const bStartsWith = bName.startsWith(normalizedQuery);

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      // Then sort alphabetically
      return aName.localeCompare(bName);
    });

  return matches.slice(0, limit);
}
