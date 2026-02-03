import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proofedItemsApi } from '../api/client';
import type { UpdateProofedItemRequest } from '@proofed/shared';

export function useProofedItems() {
  return useQuery({
    queryKey: ['proofed-items'],
    queryFn: proofedItemsApi.list,
  });
}

export function useProofedItem(proofedItemId: string) {
  return useQuery({
    queryKey: ['proofed-items', proofedItemId],
    queryFn: () => proofedItemsApi.get(proofedItemId),
    enabled: !!proofedItemId,
  });
}

export function useUpdateProofedItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      proofedItemId,
      data,
    }: {
      proofedItemId: string;
      data: UpdateProofedItemRequest;
    }) => proofedItemsApi.update(proofedItemId, data),
    onSuccess: (_, { proofedItemId }) => {
      queryClient.invalidateQueries({ queryKey: ['proofed-items'] });
      queryClient.invalidateQueries({ queryKey: ['proofed-items', proofedItemId] });
    },
  });
}

export function useDeleteProofedItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (proofedItemId: string) => proofedItemsApi.delete(proofedItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proofed-items'] });
    },
  });
}
