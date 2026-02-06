import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attemptsApi } from '../api/client';
import type {
  CreateAttemptRequest,
  UpdateAttemptRequest,
  CaptureAttemptRequest,
} from '@proofed/shared';

export function useAttempts() {
  return useQuery({
    queryKey: ['attempts'],
    queryFn: attemptsApi.list,
  });
}

export function useStarredAttempts() {
  return useQuery({
    queryKey: ['attempts', 'starred'],
    queryFn: async () => {
      const attempts = await attemptsApi.list();
      return attempts.filter((a) => a.starred === true);
    },
  });
}

export function useAttempt(attemptId: string) {
  return useQuery({
    queryKey: ['attempts', attemptId],
    queryFn: () => attemptsApi.get(attemptId),
    enabled: !!attemptId,
  });
}

export function useCreateAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAttemptRequest) => attemptsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attempts'] });
    },
  });
}

export function useUpdateAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attemptId,
      data,
    }: {
      attemptId: string;
      data: UpdateAttemptRequest;
    }) => attemptsApi.update(attemptId, data),
    onSuccess: (_, { attemptId, data }) => {
      queryClient.invalidateQueries({ queryKey: ['attempts'] });
      queryClient.invalidateQueries({ queryKey: ['attempts', attemptId] });
      // Also invalidate starred query when starred field changes
      if (data.starred !== undefined) {
        queryClient.invalidateQueries({ queryKey: ['attempts', 'starred'] });
      }
    },
  });
}

export function useDeleteAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attemptId: string) => attemptsApi.delete(attemptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attempts'] });
    },
  });
}

export function useCaptureAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attemptId,
      data,
    }: {
      attemptId: string;
      data: CaptureAttemptRequest;
    }) => attemptsApi.capture(attemptId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proofed-items'] });
    },
  });
}
