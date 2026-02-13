import { getItem, queryItems, deleteItem, updateItem } from '../lib/dynamo';
import type { ProofedItem, UpdateProofedItemRequest } from '@proofed/shared';

const TABLE_NAME = process.env.PROOFED_ITEMS_TABLE!;

export async function listProofedItems(userId: string): Promise<ProofedItem[]> {
  return queryItems<ProofedItem>(TABLE_NAME, userId);
}

export async function getProofedItemById(userId: string, proofedItemId: string): Promise<ProofedItem | null> {
  return getItem<ProofedItem>(TABLE_NAME, { userId, proofedItemId });
}

export async function updateProofedItemById(
  userId: string,
  proofedItemId: string,
  request: UpdateProofedItemRequest
): Promise<ProofedItem | null> {
  return updateItem<ProofedItem>(TABLE_NAME, { userId, proofedItemId }, request);
}

export async function deleteProofedItemById(userId: string, proofedItemId: string): Promise<void> {
  return deleteItem(TABLE_NAME, { userId, proofedItemId });
}
