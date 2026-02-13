import { useMutation } from '@tanstack/react-query';
import { recipesApi } from '../api/client';
import type { AiContainerScaleRequest, AiContainerScaleResponse } from '@proofed/shared';

export function useAiContainerScale() {
  return useMutation<
    AiContainerScaleResponse,
    Error,
    { recipeId: string; request: AiContainerScaleRequest }
  >({
    mutationFn: ({ recipeId, request }) => recipesApi.getAiContainerScale(recipeId, request),
  });
}
