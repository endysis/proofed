import { ulid } from 'ulid';
import { putItem, getItem, queryItems, deleteItem, updateItem } from '../lib/dynamo';
import type { Item, CreateItemRequest, UpdateItemRequest } from '@proofed/shared';

const TABLE_NAME = process.env.ITEMS_TABLE!;
const DEFAULT_USER_ID = 'default-user';

export async function listItems(): Promise<Item[]> {
  return queryItems<Item>(TABLE_NAME, DEFAULT_USER_ID);
}

export async function getItemById(itemId: string): Promise<Item | null> {
  return getItem<Item>(TABLE_NAME, { userId: DEFAULT_USER_ID, itemId });
}

export async function createItem(request: CreateItemRequest): Promise<Item> {
  const now = new Date().toISOString();
  const item: Item = {
    itemId: ulid(),
    userId: DEFAULT_USER_ID,
    name: request.name,
    type: request.type,
    notes: request.notes,
    createdAt: now,
    updatedAt: now,
  };
  return putItem(TABLE_NAME, item);
}

export async function updateItemById(
  itemId: string,
  request: UpdateItemRequest
): Promise<Item | null> {
  const updates: Partial<Item> = {
    ...request,
    updatedAt: new Date().toISOString(),
  };
  return updateItem<Item>(TABLE_NAME, { userId: DEFAULT_USER_ID, itemId }, updates);
}

export async function deleteItemById(itemId: string): Promise<void> {
  return deleteItem(TABLE_NAME, { userId: DEFAULT_USER_ID, itemId });
}
