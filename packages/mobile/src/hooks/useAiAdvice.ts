import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attemptsApi } from '../api/client';
import type { AiAdviceRequest, AiAdviceResponse } from '@proofed/shared';

export function useAiAdvice() {
  const queryClient = useQueryClient();

  return useMutation<AiAdviceResponse, Error, { attemptId: string; request: AiAdviceRequest }>({
    mutationFn: ({ attemptId, request }) => attemptsApi.getAiAdvice(attemptId, request),
    onSuccess: (_, { attemptId }) => {
      // Invalidate the attempt query to refresh the persisted aiAdvice data
      queryClient.invalidateQueries({ queryKey: ['attempts', attemptId] });
    },
  });
}
