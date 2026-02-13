import { ulid } from 'ulid';
import { putItem, getItem, queryItemsWithFilter, deleteItem, updateItem } from '../lib/dynamo';
import type { Recipe, CreateRecipeRequest, UpdateRecipeRequest } from '@proofed/shared';

const TABLE_NAME = process.env.RECIPES_TABLE!;

export async function listRecipes(userId: string, itemId: string): Promise<Recipe[]> {
  return queryItemsWithFilter<Recipe>(
    TABLE_NAME,
    userId,
    'itemId = :itemId',
    { ':itemId': itemId }
  );
}

export async function getRecipeById(userId: string, recipeId: string): Promise<Recipe | null> {
  return getItem<Recipe>(TABLE_NAME, { userId, recipeId });
}

export async function createRecipe(
  userId: string,
  itemId: string,
  request: CreateRecipeRequest
): Promise<Recipe> {
  const now = new Date().toISOString();
  const recipe: Recipe = {
    recipeId: ulid(),
    userId,
    itemId,
    name: request.name,
    ingredients: request.ingredients,
    prepNotes: request.prepNotes,
    bakeTime: request.bakeTime,
    bakeTemp: request.bakeTemp,
    bakeTempUnit: request.bakeTempUnit,
    customScales: request.customScales,
    container: request.container,
    createdAt: now,
    updatedAt: now,
  };
  return putItem(TABLE_NAME, recipe);
}

export async function updateRecipeById(
  userId: string,
  recipeId: string,
  request: UpdateRecipeRequest
): Promise<Recipe | null> {
  const updates: Partial<Recipe> = {
    ...request,
    updatedAt: new Date().toISOString(),
  };
  return updateItem<Recipe>(TABLE_NAME, { userId, recipeId }, updates);
}

export async function deleteRecipeById(userId: string, recipeId: string): Promise<void> {
  return deleteItem(TABLE_NAME, { userId, recipeId });
}
