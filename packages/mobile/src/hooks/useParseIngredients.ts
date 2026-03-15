import { useMutation } from '@tanstack/react-query';
import { ingredientsApi } from '../api/client';
import type { AiParseIngredientsRequest, AiParseIngredientsResponse } from '@proofed/shared';

export function useParseIngredients() {
  return useMutation<AiParseIngredientsResponse, Error, AiParseIngredientsRequest>({
    mutationFn: (request) => ingredientsApi.parse(request),
  });
}
