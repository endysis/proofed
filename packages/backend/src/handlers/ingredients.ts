import { ulid } from 'ulid';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { putItem } from '../lib/dynamo';
import type {
  IngredientsData,
  IngredientSubmission,
  SubmitIngredientRequest,
} from '@proofed/shared';

const TABLE_NAME = process.env.INGREDIENT_SUBMISSIONS_TABLE!;
const ASSETS_BUCKET = process.env.ASSETS_BUCKET!;

const s3Client = new S3Client({});

export async function getIngredients(): Promise<IngredientsData> {
  const command = new GetObjectCommand({
    Bucket: ASSETS_BUCKET,
    Key: 'data/ingredients.json',
  });

  const response = await s3Client.send(command);
  const bodyString = await response.Body?.transformToString();

  if (!bodyString) {
    throw new Error('Failed to read ingredients data');
  }

  return JSON.parse(bodyString) as IngredientsData;
}

export async function submitIngredient(
  userId: string,
  request: SubmitIngredientRequest
): Promise<IngredientSubmission> {
  const now = new Date().toISOString();
  const submission: IngredientSubmission = {
    submissionId: ulid(),
    name: request.name.trim(),
    userId,
    status: 'pending',
    createdAt: now,
  };

  await putItem(TABLE_NAME, submission);
  return submission;
}
