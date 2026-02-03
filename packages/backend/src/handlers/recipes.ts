import { ulid } from 'ulid';
import { putItem, getItem, queryItemsWithFilter, deleteItem, updateItem } from '../lib/dynamo';
import type { Recipe, CreateRecipeRequest, UpdateRecipeRequest } from '@proofed/shared';

const TABLE_NAME = process.env.RECIPES_TABLE!;
const DEFAULT_USER_ID = 'default-user';

export async function listRecipes(itemId: string): Promise<Recipe[]> {
  return queryItemsWithFilter<Recipe>(
    TABLE_NAME,
    DEFAULT_USER_ID,
    'itemId = :itemId',
    { ':itemId': itemId }
  );
}

export async function getRecipeById(recipeId: string): Promise<Recipe | null> {
  return getItem<Recipe>(TABLE_NAME, { userId: DEFAULT_USER_ID, recipeId });
}

export async function createRecipe(
  itemId: string,
  request: CreateRecipeRequest
): Promise<Recipe> {
  const now = new Date().toISOString();
  const recipe: Recipe = {
    recipeId: ulid(),
    userId: DEFAULT_USER_ID,
    itemId,
    name: request.name,
    ingredients: request.ingredients,
    prepNotes: request.prepNotes,
    createdAt: now,
    updatedAt: now,
  };
  return putItem(TABLE_NAME, recipe);
}

export async function updateRecipeById(
  recipeId: string,
  request: UpdateRecipeRequest
): Promise<Recipe | null> {
  const updates: Partial<Recipe> = {
    ...request,
    updatedAt: new Date().toISOString(),
  };
  return updateItem<Recipe>(TABLE_NAME, { userId: DEFAULT_USER_ID, recipeId }, updates);
}

export async function deleteRecipeById(recipeId: string): Promise<void> {
  return deleteItem(TABLE_NAME, { userId: DEFAULT_USER_ID, recipeId });
}
