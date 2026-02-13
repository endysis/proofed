import { ulid } from 'ulid';
import { putItem, getItem, queryItems, deleteItem, updateItem } from '../lib/dynamo';
import type {
  Attempt,
  ProofedItem,
  CreateAttemptRequest,
  UpdateAttemptRequest,
  CaptureAttemptRequest,
} from '@proofed/shared';

const ATTEMPTS_TABLE = process.env.ATTEMPTS_TABLE!;
const PROOFED_ITEMS_TABLE = process.env.PROOFED_ITEMS_TABLE!;

export async function listAttempts(userId: string): Promise<Attempt[]> {
  return queryItems<Attempt>(ATTEMPTS_TABLE, userId);
}

export async function getAttemptById(userId: string, attemptId: string): Promise<Attempt | null> {
  return getItem<Attempt>(ATTEMPTS_TABLE, { userId, attemptId });
}

export async function createAttempt(userId: string, request: CreateAttemptRequest): Promise<Attempt> {
  const now = new Date().toISOString();
  const attempt: Attempt = {
    attemptId: ulid(),
    userId,
    name: request.name,
    date: request.date,
    ovenTemp: request.ovenTemp,
    ovenTempUnit: request.ovenTempUnit,
    bakeTime: request.bakeTime,
    itemUsages: request.itemUsages,
    notes: request.notes,
    status: request.status || 'planning',
    createdAt: now,
  };
  return putItem(ATTEMPTS_TABLE, attempt);
}

export async function updateAttemptById(
  userId: string,
  attemptId: string,
  request: UpdateAttemptRequest
): Promise<Attempt | null> {
  return updateItem<Attempt>(ATTEMPTS_TABLE, { userId, attemptId }, request);
}

export async function deleteAttemptById(userId: string, attemptId: string): Promise<void> {
  return deleteItem(ATTEMPTS_TABLE, { userId, attemptId });
}

export async function captureAttempt(
  userId: string,
  attemptId: string,
  request: CaptureAttemptRequest
): Promise<ProofedItem> {
  const attempt = await getAttemptById(userId, attemptId);
  if (!attempt) {
    throw new Error('Attempt not found');
  }

  const now = new Date().toISOString();
  const proofedItem: ProofedItem = {
    proofedItemId: ulid(),
    userId,
    name: request.name,
    capturedFromAttemptId: attemptId,
    itemConfigs: attempt.itemUsages,
    notes: request.notes,
    createdAt: now,
  };

  return putItem(PROOFED_ITEMS_TABLE, proofedItem);
}
