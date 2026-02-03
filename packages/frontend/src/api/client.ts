import type {
  Item,
  Recipe,
  Variant,
  Attempt,
  ProofedItem,
  CreateItemRequest,
  UpdateItemRequest,
  CreateRecipeRequest,
  UpdateRecipeRequest,
  CreateVariantRequest,
  UpdateVariantRequest,
  CreateAttemptRequest,
  UpdateAttemptRequest,
  CaptureAttemptRequest,
  UpdateProofedItemRequest,
  PhotoUploadRequest,
  PhotoUploadResponse,
} from '@proofed/shared';
import {
  mockItemsApi,
  mockRecipesApi,
  mockVariantsApi,
  mockAttemptsApi,
  mockProofedItemsApi,
  mockPhotosApi,
} from './mock';

const API_BASE = import.meta.env.VITE_API_URL;
const USE_MOCK = !API_BASE;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// Items
export const itemsApi = USE_MOCK
  ? mockItemsApi
  : {
      list: () => request<{ items: Item[] }>('/items').then((r) => r.items),
      get: (itemId: string) => request<Item>(`/items/${itemId}`),
      create: (data: CreateItemRequest) =>
        request<Item>('/items', { method: 'POST', body: JSON.stringify(data) }),
      update: (itemId: string, data: UpdateItemRequest) =>
        request<Item>(`/items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (itemId: string) => request<void>(`/items/${itemId}`, { method: 'DELETE' }),
    };

// Recipes
export const recipesApi = USE_MOCK
  ? mockRecipesApi
  : {
      list: (itemId: string) =>
        request<{ items: Recipe[] }>(`/items/${itemId}/recipes`).then((r) => r.items),
      get: (itemId: string, recipeId: string) =>
        request<Recipe>(`/items/${itemId}/recipes/${recipeId}`),
      create: (itemId: string, data: CreateRecipeRequest) =>
        request<Recipe>(`/items/${itemId}/recipes`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (itemId: string, recipeId: string, data: UpdateRecipeRequest) =>
        request<Recipe>(`/items/${itemId}/recipes/${recipeId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (itemId: string, recipeId: string) =>
        request<void>(`/items/${itemId}/recipes/${recipeId}`, { method: 'DELETE' }),
    };

// Variants
export const variantsApi = USE_MOCK
  ? mockVariantsApi
  : {
      list: (itemId: string, recipeId: string) =>
        request<{ items: Variant[] }>(
          `/items/${itemId}/recipes/${recipeId}/variants`
        ).then((r) => r.items),
      get: (itemId: string, recipeId: string, variantId: string) =>
        request<Variant>(`/items/${itemId}/recipes/${recipeId}/variants/${variantId}`),
      create: (itemId: string, recipeId: string, data: CreateVariantRequest) =>
        request<Variant>(`/items/${itemId}/recipes/${recipeId}/variants`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (
        itemId: string,
        recipeId: string,
        variantId: string,
        data: UpdateVariantRequest
      ) =>
        request<Variant>(
          `/items/${itemId}/recipes/${recipeId}/variants/${variantId}`,
          { method: 'PUT', body: JSON.stringify(data) }
        ),
      delete: (itemId: string, recipeId: string, variantId: string) =>
        request<void>(`/items/${itemId}/recipes/${recipeId}/variants/${variantId}`, {
          method: 'DELETE',
        }),
    };

// Attempts
export const attemptsApi = USE_MOCK
  ? mockAttemptsApi
  : {
      list: () => request<{ items: Attempt[] }>('/attempts').then((r) => r.items),
      get: (attemptId: string) => request<Attempt>(`/attempts/${attemptId}`),
      create: (data: CreateAttemptRequest) =>
        request<Attempt>('/attempts', { method: 'POST', body: JSON.stringify(data) }),
      update: (attemptId: string, data: UpdateAttemptRequest) =>
        request<Attempt>(`/attempts/${attemptId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (attemptId: string) =>
        request<void>(`/attempts/${attemptId}`, { method: 'DELETE' }),
      capture: (attemptId: string, data: CaptureAttemptRequest) =>
        request<ProofedItem>(`/attempts/${attemptId}/capture`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
    };

// Proofed Items
export const proofedItemsApi = USE_MOCK
  ? mockProofedItemsApi
  : {
      list: () =>
        request<{ items: ProofedItem[] }>('/proofed-items').then((r) => r.items),
      get: (proofedItemId: string) =>
        request<ProofedItem>(`/proofed-items/${proofedItemId}`),
      update: (proofedItemId: string, data: UpdateProofedItemRequest) =>
        request<ProofedItem>(`/proofed-items/${proofedItemId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (proofedItemId: string) =>
        request<void>(`/proofed-items/${proofedItemId}`, { method: 'DELETE' }),
    };

// Photos
export const photosApi = USE_MOCK
  ? mockPhotosApi
  : {
      getUploadUrl: (data: PhotoUploadRequest) =>
        request<PhotoUploadResponse>('/photos/upload-url', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      upload: async (uploadUrl: string, file: File) => {
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to upload photo');
        }
      },
    };
