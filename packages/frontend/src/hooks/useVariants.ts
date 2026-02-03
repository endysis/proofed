import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { variantsApi } from '../api/client';
import type { CreateVariantRequest, UpdateVariantRequest } from '@proofed/shared';

export function useVariants(itemId: string, recipeId: string) {
  return useQuery({
    queryKey: ['variants', itemId, recipeId],
    queryFn: () => variantsApi.list(itemId, recipeId),
    enabled: !!itemId && !!recipeId,
  });
}

export function useVariant(itemId: string, recipeId: string, variantId: string) {
  return useQuery({
    queryKey: ['variants', itemId, recipeId, variantId],
    queryFn: () => variantsApi.get(itemId, recipeId, variantId),
    enabled: !!itemId && !!recipeId && !!variantId,
  });
}

export function useCreateVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      recipeId,
      data,
    }: {
      itemId: string;
      recipeId: string;
      data: CreateVariantRequest;
    }) => variantsApi.create(itemId, recipeId, data),
    onSuccess: (_, { itemId, recipeId }) => {
      queryClient.invalidateQueries({ queryKey: ['variants', itemId, recipeId] });
    },
  });
}

export function useUpdateVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      recipeId,
      variantId,
      data,
    }: {
      itemId: string;
      recipeId: string;
      variantId: string;
      data: UpdateVariantRequest;
    }) => variantsApi.update(itemId, recipeId, variantId, data),
    onSuccess: (_, { itemId, recipeId, variantId }) => {
      queryClient.invalidateQueries({ queryKey: ['variants', itemId, recipeId] });
      queryClient.invalidateQueries({
        queryKey: ['variants', itemId, recipeId, variantId],
      });
    },
  });
}

export function useDeleteVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      recipeId,
      variantId,
    }: {
      itemId: string;
      recipeId: string;
      variantId: string;
    }) => variantsApi.delete(itemId, recipeId, variantId),
    onSuccess: (_, { itemId, recipeId }) => {
      queryClient.invalidateQueries({ queryKey: ['variants', itemId, recipeId] });
    },
  });
}
