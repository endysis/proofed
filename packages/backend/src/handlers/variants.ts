import { ulid } from 'ulid';
import { putItem, getItem, queryItemsWithFilter, deleteItem, updateItem } from '../lib/dynamo';
import type { Variant, CreateVariantRequest, UpdateVariantRequest } from '@proofed/shared';

const TABLE_NAME = process.env.VARIANTS_TABLE!;

export async function listVariants(userId: string, recipeId: string): Promise<Variant[]> {
  return queryItemsWithFilter<Variant>(
    TABLE_NAME,
    userId,
    'recipeId = :recipeId',
    { ':recipeId': recipeId }
  );
}

export async function getVariantById(userId: string, variantId: string): Promise<Variant | null> {
  return getItem<Variant>(TABLE_NAME, { userId, variantId });
}

export async function createVariant(
  userId: string,
  itemId: string,
  recipeId: string,
  request: CreateVariantRequest
): Promise<Variant> {
  const now = new Date().toISOString();
  const variant: Variant = {
    variantId: ulid(),
    userId,
    recipeId,
    itemId,
    name: request.name,
    ingredientOverrides: request.ingredientOverrides,
    notes: request.notes,
    createdAt: now,
    updatedAt: now,
  };
  return putItem(TABLE_NAME, variant);
}

export async function updateVariantById(
  userId: string,
  variantId: string,
  request: UpdateVariantRequest
): Promise<Variant | null> {
  const updates: Partial<Variant> = {
    ...request,
    updatedAt: new Date().toISOString(),
  };
  return updateItem<Variant>(TABLE_NAME, { userId, variantId }, updates);
}

export async function deleteVariantById(userId: string, variantId: string): Promise<void> {
  return deleteItem(TABLE_NAME, { userId, variantId });
}
