import { useMutation } from '@tanstack/react-query';
import { attemptsApi } from '../api/client';
import type { CrumbChatRequest, CrumbChatResponse } from '@proofed/shared';

export function useCrumbChat() {
  return useMutation<CrumbChatResponse, Error, { attemptId: string; request: CrumbChatRequest }>({
    mutationFn: ({ attemptId, request }) => attemptsApi.crumbChat(attemptId, request),
  });
}
