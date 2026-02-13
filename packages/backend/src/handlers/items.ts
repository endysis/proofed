import { ulid } from 'ulid';
import { putItem, getItem, queryItems, deleteItem, updateItem } from '../lib/dynamo';
import type { Item, CreateItemRequest, UpdateItemRequest } from '@proofed/shared';

const TABLE_NAME = process.env.ITEMS_TABLE!;

export async function listItems(userId: string): Promise<Item[]> {
  return queryItems<Item>(TABLE_NAME, userId);
}

export async function getItemById(userId: string, itemId: string): Promise<Item | null> {
  return getItem<Item>(TABLE_NAME, { userId, itemId });
}

export async function createItem(userId: string, request: CreateItemRequest): Promise<Item> {
  const now = new Date().toISOString();
  const item: Item = {
    itemId: ulid(),
    userId,
    name: request.name,
    type: request.type,
    notes: request.notes,
    bakeTime: request.bakeTime,
    bakeTemp: request.bakeTemp,
    bakeTempUnit: request.bakeTempUnit,
    createdAt: now,
    updatedAt: now,
  };
  return putItem(TABLE_NAME, item);
}

export async function updateItemById(
  userId: string,
  itemId: string,
  request: UpdateItemRequest
): Promise<Item | null> {
  const updates: Partial<Item> = {
    ...request,
    updatedAt: new Date().toISOString(),
  };
  return updateItem<Item>(TABLE_NAME, { userId, itemId }, updates);
}

export async function deleteItemById(userId: string, itemId: string): Promise<void> {
  return deleteItem(TABLE_NAME, { userId, itemId });
}
