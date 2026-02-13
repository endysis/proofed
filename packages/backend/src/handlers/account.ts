import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { queryItems, deleteItem } from '../lib/dynamo';
import type { Item, Recipe, Variant, Attempt, ProofedItem } from '@proofed/shared';

const s3Client = new S3Client({});
const ITEMS_TABLE = process.env.ITEMS_TABLE!;
const RECIPES_TABLE = process.env.RECIPES_TABLE!;
const VARIANTS_TABLE = process.env.VARIANTS_TABLE!;
const ATTEMPTS_TABLE = process.env.ATTEMPTS_TABLE!;
const PROOFED_ITEMS_TABLE = process.env.PROOFED_ITEMS_TABLE!;
const PHOTOS_BUCKET = process.env.PHOTOS_BUCKET!;

export async function deleteAccount(userId: string): Promise<void> {
  // Delete all items
  const items = await queryItems<Item>(ITEMS_TABLE, userId);
  for (const item of items) {
    await deleteItem(ITEMS_TABLE, { userId, itemId: item.itemId });
  }

  // Delete all recipes
  const recipes = await queryItems<Recipe>(RECIPES_TABLE, userId);
  for (const recipe of recipes) {
    await deleteItem(RECIPES_TABLE, { userId, recipeId: recipe.recipeId });
  }

  // Delete all variants
  const variants = await queryItems<Variant>(VARIANTS_TABLE, userId);
  for (const variant of variants) {
    await deleteItem(VARIANTS_TABLE, { userId, variantId: variant.variantId });
  }

  // Delete all attempts
  const attempts = await queryItems<Attempt>(ATTEMPTS_TABLE, userId);
  for (const attempt of attempts) {
    await deleteItem(ATTEMPTS_TABLE, { userId, attemptId: attempt.attemptId });
  }

  // Delete all proofed items
  const proofedItems = await queryItems<ProofedItem>(PROOFED_ITEMS_TABLE, userId);
  for (const proofedItem of proofedItems) {
    await deleteItem(PROOFED_ITEMS_TABLE, { userId, proofedItemId: proofedItem.proofedItemId });
  }

  // Delete all photos from S3
  await deleteUserPhotos(userId);
}

async function deleteUserPhotos(userId: string): Promise<void> {
  const prefix = `${userId}/`;

  let continuationToken: string | undefined;

  do {
    const listResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: PHOTOS_BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    if (listResponse.Contents && listResponse.Contents.length > 0) {
      const objectsToDelete = listResponse.Contents.map((obj) => ({ Key: obj.Key! }));

      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: PHOTOS_BUCKET,
          Delete: { Objects: objectsToDelete },
        })
      );
    }

    continuationToken = listResponse.NextContinuationToken;
  } while (continuationToken);
}
