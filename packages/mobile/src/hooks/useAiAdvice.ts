import { useMutation } from '@tanstack/react-query';
import { attemptsApi } from '../api/client';
import type { AiAdviceRequest, AiAdviceResponse } from '@proofed/shared';

export function useAiAdvice() {
  return useMutation<AiAdviceResponse, Error, { attemptId: string; request: AiAdviceRequest }>({
    mutationFn: ({ attemptId, request }) => attemptsApi.getAiAdvice(attemptId, request),
  });
}
