import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipesApi } from '../api/client';
import type { CreateRecipeRequest, UpdateRecipeRequest } from '@proofed/shared';

export function useRecipes(itemId: string) {
  return useQuery({
    queryKey: ['recipes', itemId],
    queryFn: () => recipesApi.list(itemId),
    enabled: !!itemId,
  });
}

export function useRecipe(itemId: string, recipeId: string) {
  return useQuery({
    queryKey: ['recipes', itemId, recipeId],
    queryFn: () => recipesApi.get(itemId, recipeId),
    enabled: !!itemId && !!recipeId,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: CreateRecipeRequest }) =>
      recipesApi.create(itemId, data),
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['recipes', itemId] });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      recipeId,
      data,
    }: {
      itemId: string;
      recipeId: string;
      data: UpdateRecipeRequest;
    }) => recipesApi.update(itemId, recipeId, data),
    onSuccess: (_, { itemId, recipeId }) => {
      queryClient.invalidateQueries({ queryKey: ['recipes', itemId] });
      queryClient.invalidateQueries({ queryKey: ['recipes', itemId, recipeId] });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, recipeId }: { itemId: string; recipeId: string }) =>
      recipesApi.delete(itemId, recipeId),
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['recipes', itemId] });
    },
  });
}
