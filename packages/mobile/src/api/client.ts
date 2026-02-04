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
  PhotoDownloadRequest,
  PhotoDownloadResponse,
} from '@proofed/shared';
import { API_BASE, USE_MOCK } from './config';

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
export const itemsApi = {
  list: () => request<{ items: Item[] }>('/items').then((r) => r.items),
  get: (itemId: string) => request<Item>(`/items/${itemId}`),
  create: (data: CreateItemRequest) =>
    request<Item>('/items', { method: 'POST', body: JSON.stringify(data) }),
  update: (itemId: string, data: UpdateItemRequest) =>
    request<Item>(`/items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (itemId: string) => request<void>(`/items/${itemId}`, { method: 'DELETE' }),
};

// Recipes
export const recipesApi = {
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
export const variantsApi = {
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
export const attemptsApi = {
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
export const proofedItemsApi = {
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

// Photos - adapted for React Native
export interface ImageAsset {
  uri: string;
  type: string;
  fileName?: string;
}

export const photosApi = {
  getUploadUrl: (data: PhotoUploadRequest) =>
    request<PhotoUploadResponse>('/photos/upload-url', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getDownloadUrl: (data: PhotoDownloadRequest) =>
    request<PhotoDownloadResponse>('/photos/download-url', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  upload: async (uploadUrl: string, image: ImageAsset) => {
    // For React Native, we need to upload the image from its URI
    const response = await fetch(image.uri);
    const blob = await response.blob();

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': image.type || 'image/jpeg',
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload photo');
    }
  },
};
