/**
 * Migration script to transfer data from default-user to a new Cognito user ID
 *
 * Usage:
 *   npx ts-node packages/backend/scripts/migrate-user.ts <new-cognito-user-id>
 *
 * Prerequisites:
 *   - AWS credentials configured
 *   - The new Cognito user ID (sub) from signing up with your email
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  DeleteCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  S3Client,
  ListObjectsV2Command,
  CopyObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';

const OLD_USER_ID = 'default-user';

// Table configuration
const TABLES = {
  items: { name: 'proofed-items', sortKey: 'itemId' },
  recipes: { name: 'proofed-recipes', sortKey: 'recipeId' },
  variants: { name: 'proofed-variants', sortKey: 'variantId' },
  attempts: { name: 'proofed-attempts', sortKey: 'attemptId' },
  proofedItems: { name: 'proofed-proofed-items', sortKey: 'proofedItemId' },
};

const PHOTOS_BUCKET = process.env.PHOTOS_BUCKET || 'proofed-photos-135753342791-eu-west-2';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

async function migrateTable(
  tableName: string,
  sortKey: string,
  newUserId: string
): Promise<number> {
  console.log(`\nMigrating table: ${tableName}`);

  // Query all items for old user
  const queryResult = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': OLD_USER_ID,
      },
    })
  );

  const items = queryResult.Items || [];
  console.log(`  Found ${items.length} items to migrate`);

  for (const item of items) {
    const sortKeyValue = item[sortKey];

    // Create new item with new userId
    const newItem = {
      ...item,
      userId: newUserId,
    };

    // Put new item
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: newItem,
      })
    );

    // Delete old item
    await docClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: {
          userId: OLD_USER_ID,
          [sortKey]: sortKeyValue,
        },
      })
    );

    console.log(`  Migrated: ${sortKeyValue}`);
  }

  return items.length;
}

async function migratePhotos(newUserId: string): Promise<number> {
  console.log(`\nMigrating photos from S3`);

  const oldPrefix = `${OLD_USER_ID}/`;
  const newPrefix = `${newUserId}/`;

  let continuationToken: string | undefined;
  let totalMigrated = 0;

  do {
    const listResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: PHOTOS_BUCKET,
        Prefix: oldPrefix,
        ContinuationToken: continuationToken,
      })
    );

    const objects = listResponse.Contents || [];
    console.log(`  Found ${objects.length} photos to migrate`);

    for (const obj of objects) {
      if (!obj.Key) continue;

      const newKey = obj.Key.replace(oldPrefix, newPrefix);

      // Copy to new location
      await s3Client.send(
        new CopyObjectCommand({
          Bucket: PHOTOS_BUCKET,
          CopySource: `${PHOTOS_BUCKET}/${obj.Key}`,
          Key: newKey,
        })
      );

      console.log(`  Copied: ${obj.Key} -> ${newKey}`);
      totalMigrated++;
    }

    // Delete old objects
    if (objects.length > 0) {
      const objectsToDelete = objects
        .filter((obj) => obj.Key)
        .map((obj) => ({ Key: obj.Key! }));

      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: PHOTOS_BUCKET,
          Delete: { Objects: objectsToDelete },
        })
      );

      console.log(`  Deleted ${objectsToDelete.length} old photos`);
    }

    continuationToken = listResponse.NextContinuationToken;
  } while (continuationToken);

  return totalMigrated;
}

async function updatePhotoKeysInAttempts(newUserId: string): Promise<void> {
  console.log(`\nUpdating photo keys in attempts`);

  const queryResult = await docClient.send(
    new QueryCommand({
      TableName: TABLES.attempts.name,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': newUserId,
      },
    })
  );

  const attempts = queryResult.Items || [];

  for (const attempt of attempts) {
    let updated = false;
    const updatedAttempt = { ...attempt };

    // Update mainPhotoKey
    if (attempt.mainPhotoKey?.startsWith(OLD_USER_ID)) {
      updatedAttempt.mainPhotoKey = attempt.mainPhotoKey.replace(OLD_USER_ID, newUserId);
      updated = true;
    }

    // Update photoKeys array
    if (attempt.photoKeys?.length) {
      updatedAttempt.photoKeys = attempt.photoKeys.map((key: string) =>
        key.startsWith(OLD_USER_ID) ? key.replace(OLD_USER_ID, newUserId) : key
      );
      updated = true;
    }

    if (updated) {
      await docClient.send(
        new PutCommand({
          TableName: TABLES.attempts.name,
          Item: updatedAttempt,
        })
      );
      console.log(`  Updated photo keys for attempt: ${attempt.attemptId}`);
    }
  }
}

async function main() {
  const newUserId = process.argv[2];

  if (!newUserId) {
    console.error('Usage: npx ts-node migrate-user.ts <new-cognito-user-id>');
    console.error('\nTo get your Cognito user ID:');
    console.error('1. Sign up in the app with your email');
    console.error('2. Check the Cognito User Pool in AWS Console');
    console.error('3. Find your user and copy the "sub" attribute');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('Proofed User Data Migration');
  console.log('='.repeat(60));
  console.log(`Old User ID: ${OLD_USER_ID}`);
  console.log(`New User ID: ${newUserId}`);
  console.log('='.repeat(60));

  let totalItems = 0;

  // Migrate each table
  for (const [key, config] of Object.entries(TABLES)) {
    const count = await migrateTable(config.name, config.sortKey, newUserId);
    totalItems += count;
  }

  // Migrate photos
  const photosCount = await migratePhotos(newUserId);

  // Update photo keys in attempts
  await updatePhotoKeysInAttempts(newUserId);

  console.log('\n' + '='.repeat(60));
  console.log('Migration Complete!');
  console.log('='.repeat(60));
  console.log(`Total DynamoDB items migrated: ${totalItems}`);
  console.log(`Total photos migrated: ${photosCount}`);
  console.log('\nYou can now sign in to the app with your new account.');
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
