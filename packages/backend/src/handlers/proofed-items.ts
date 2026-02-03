import { getItem, queryItems, deleteItem, updateItem } from '../lib/dynamo';
import type { ProofedItem, UpdateProofedItemRequest } from '@proofed/shared';

const TABLE_NAME = process.env.PROOFED_ITEMS_TABLE!;
const DEFAULT_USER_ID = 'default-user';

export async function listProofedItems(): Promise<ProofedItem[]> {
  return queryItems<ProofedItem>(TABLE_NAME, DEFAULT_USER_ID);
}

export async function getProofedItemById(proofedItemId: string): Promise<ProofedItem | null> {
  return getItem<ProofedItem>(TABLE_NAME, { userId: DEFAULT_USER_ID, proofedItemId });
}

export async function updateProofedItemById(
  proofedItemId: string,
  request: UpdateProofedItemRequest
): Promise<ProofedItem | null> {
  return updateItem<ProofedItem>(TABLE_NAME, { userId: DEFAULT_USER_ID, proofedItemId }, request);
}

export async function deleteProofedItemById(proofedItemId: string): Promise<void> {
  return deleteItem(TABLE_NAME, { userId: DEFAULT_USER_ID, proofedItemId });
}
