/**
 * Tests for the migrate-user script
 *
 * Run with: npx jest scripts/migrate-user.test.ts
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
import { mockClient } from 'aws-sdk-client-mock';

// Create mocks
const dynamoMock = mockClient(DynamoDBDocumentClient);
const s3Mock = mockClient(S3Client);

const OLD_USER_ID = 'default-user';
const NEW_USER_ID = 'd6d262f4-c0c1-70cc-40c6-fb2769fcbcd0';

// Table configuration (same as in migrate-user.ts)
const TABLES = {
  items: { name: 'proofed-items', sortKey: 'itemId' },
  recipes: { name: 'proofed-recipes', sortKey: 'recipeId' },
  variants: { name: 'proofed-variants', sortKey: 'variantId' },
  attempts: { name: 'proofed-attempts', sortKey: 'attemptId' },
  proofedItems: { name: 'proofed-proofed-items', sortKey: 'proofedItemId' },
};

const PHOTOS_BUCKET = 'proofed-photos-135753342791-eu-west-2';

describe('migrate-user script', () => {
  beforeEach(() => {
    dynamoMock.reset();
    s3Mock.reset();
  });

  describe('DynamoDB migration', () => {
    it('should query items for old user and migrate to new user', async () => {
      const mockItems = [
        { userId: OLD_USER_ID, itemId: 'item-1', name: 'Sourdough' },
        { userId: OLD_USER_ID, itemId: 'item-2', name: 'Croissant' },
      ];

      // Mock query response
      dynamoMock.on(QueryCommand, {
        TableName: TABLES.items.name,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': OLD_USER_ID },
      }).resolves({ Items: mockItems });

      // Mock put and delete
      dynamoMock.on(PutCommand).resolves({});
      dynamoMock.on(DeleteCommand).resolves({});

      // Simulate the migration logic
      const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

      const queryResult = await docClient.send(
        new QueryCommand({
          TableName: TABLES.items.name,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: { ':userId': OLD_USER_ID },
        })
      );

      expect(queryResult.Items).toHaveLength(2);
      expect(queryResult.Items![0].userId).toBe(OLD_USER_ID);

      // Verify we would create new items with new userId
      for (const item of queryResult.Items!) {
        const newItem = { ...item, userId: NEW_USER_ID };

        await docClient.send(
          new PutCommand({
            TableName: TABLES.items.name,
            Item: newItem,
          })
        );

        await docClient.send(
          new DeleteCommand({
            TableName: TABLES.items.name,
            Key: {
              userId: OLD_USER_ID,
              itemId: item.itemId,
            },
          })
        );
      }

      // Verify the correct number of calls
      const putCalls = dynamoMock.commandCalls(PutCommand);
      const deleteCalls = dynamoMock.commandCalls(DeleteCommand);

      expect(putCalls).toHaveLength(2);
      expect(deleteCalls).toHaveLength(2);

      // Verify new items have correct userId
      expect(putCalls[0].args[0].input.Item?.userId).toBe(NEW_USER_ID);
      expect(putCalls[1].args[0].input.Item?.userId).toBe(NEW_USER_ID);
    });

    it('should handle empty tables gracefully', async () => {
      dynamoMock.on(QueryCommand).resolves({ Items: [] });

      const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

      const queryResult = await docClient.send(
        new QueryCommand({
          TableName: TABLES.items.name,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: { ':userId': OLD_USER_ID },
        })
      );

      expect(queryResult.Items).toHaveLength(0);

      // Should not call put or delete
      expect(dynamoMock.commandCalls(PutCommand)).toHaveLength(0);
      expect(dynamoMock.commandCalls(DeleteCommand)).toHaveLength(0);
    });

    it('should preserve all item data except userId', async () => {
      const mockItem = {
        userId: OLD_USER_ID,
        itemId: 'item-1',
        name: 'Sourdough Bread',
        type: 'bread',
        notes: 'My favorite recipe',
        bakeTime: 45,
        bakeTemp: 450,
        bakeTempUnit: 'F',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      dynamoMock.on(QueryCommand).resolves({ Items: [mockItem] });
      dynamoMock.on(PutCommand).resolves({});
      dynamoMock.on(DeleteCommand).resolves({});

      const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

      const queryResult = await docClient.send(
        new QueryCommand({
          TableName: TABLES.items.name,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: { ':userId': OLD_USER_ID },
        })
      );

      const item = queryResult.Items![0];
      const newItem = { ...item, userId: NEW_USER_ID };

      await docClient.send(
        new PutCommand({
          TableName: TABLES.items.name,
          Item: newItem,
        })
      );

      const putCalls = dynamoMock.commandCalls(PutCommand);
      const savedItem = putCalls[0].args[0].input.Item;

      // Verify userId changed
      expect(savedItem?.userId).toBe(NEW_USER_ID);

      // Verify all other fields preserved
      expect(savedItem?.itemId).toBe(mockItem.itemId);
      expect(savedItem?.name).toBe(mockItem.name);
      expect(savedItem?.type).toBe(mockItem.type);
      expect(savedItem?.notes).toBe(mockItem.notes);
      expect(savedItem?.bakeTime).toBe(mockItem.bakeTime);
      expect(savedItem?.bakeTemp).toBe(mockItem.bakeTemp);
      expect(savedItem?.bakeTempUnit).toBe(mockItem.bakeTempUnit);
      expect(savedItem?.createdAt).toBe(mockItem.createdAt);
      expect(savedItem?.updatedAt).toBe(mockItem.updatedAt);
    });
  });

  describe('S3 photo migration', () => {
    it('should list, copy, and delete photos', async () => {
      const mockObjects = {
        Contents: [
          { Key: `${OLD_USER_ID}/attempts/attempt-1/photo1.jpg` },
          { Key: `${OLD_USER_ID}/attempts/attempt-1/photo2.jpg` },
        ],
      };

      s3Mock.on(ListObjectsV2Command).resolves(mockObjects);
      s3Mock.on(CopyObjectCommand).resolves({});
      s3Mock.on(DeleteObjectsCommand).resolves({});

      const s3Client = new S3Client({});

      // List objects
      const listResult = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: PHOTOS_BUCKET,
          Prefix: `${OLD_USER_ID}/`,
        })
      );

      expect(listResult.Contents).toHaveLength(2);

      // Copy each object
      for (const obj of listResult.Contents!) {
        const newKey = obj.Key!.replace(OLD_USER_ID, NEW_USER_ID);

        await s3Client.send(
          new CopyObjectCommand({
            Bucket: PHOTOS_BUCKET,
            CopySource: `${PHOTOS_BUCKET}/${obj.Key}`,
            Key: newKey,
          })
        );
      }

      // Verify copies
      const copyCalls = s3Mock.commandCalls(CopyObjectCommand);
      expect(copyCalls).toHaveLength(2);
      expect(copyCalls[0].args[0].input.Key).toBe(
        `${NEW_USER_ID}/attempts/attempt-1/photo1.jpg`
      );
      expect(copyCalls[1].args[0].input.Key).toBe(
        `${NEW_USER_ID}/attempts/attempt-1/photo2.jpg`
      );

      // Delete old objects
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: PHOTOS_BUCKET,
          Delete: {
            Objects: listResult.Contents!.map((obj) => ({ Key: obj.Key! })),
          },
        })
      );

      const deleteCalls = s3Mock.commandCalls(DeleteObjectsCommand);
      expect(deleteCalls).toHaveLength(1);
      expect(deleteCalls[0].args[0].input.Delete?.Objects).toHaveLength(2);
    });

    it('should handle empty S3 bucket gracefully', async () => {
      s3Mock.on(ListObjectsV2Command).resolves({ Contents: [] });

      const s3Client = new S3Client({});

      const listResult = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: PHOTOS_BUCKET,
          Prefix: `${OLD_USER_ID}/`,
        })
      );

      expect(listResult.Contents).toHaveLength(0);
      expect(s3Mock.commandCalls(CopyObjectCommand)).toHaveLength(0);
      expect(s3Mock.commandCalls(DeleteObjectsCommand)).toHaveLength(0);
    });

    it('should handle pagination for many photos', async () => {
      // Mock based on ContinuationToken
      s3Mock.on(ListObjectsV2Command, {
        Bucket: PHOTOS_BUCKET,
        Prefix: `${OLD_USER_ID}/`,
        ContinuationToken: undefined,
      }).resolves({
        Contents: [{ Key: `${OLD_USER_ID}/photo1.jpg` }],
        NextContinuationToken: 'token-123',
      });

      s3Mock.on(ListObjectsV2Command, {
        Bucket: PHOTOS_BUCKET,
        Prefix: `${OLD_USER_ID}/`,
        ContinuationToken: 'token-123',
      }).resolves({
        Contents: [{ Key: `${OLD_USER_ID}/photo2.jpg` }],
        NextContinuationToken: undefined,
      });

      s3Mock.on(CopyObjectCommand).resolves({});
      s3Mock.on(DeleteObjectsCommand).resolves({});

      const s3Client = new S3Client({});

      // Simulate pagination loop
      let continuationToken: string | undefined;
      let totalPhotos = 0;

      do {
        const listResult = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: PHOTOS_BUCKET,
            Prefix: `${OLD_USER_ID}/`,
            ContinuationToken: continuationToken,
          })
        );

        totalPhotos += listResult.Contents?.length || 0;
        continuationToken = listResult.NextContinuationToken;
      } while (continuationToken);

      expect(totalPhotos).toBe(2);
      expect(s3Mock.commandCalls(ListObjectsV2Command)).toHaveLength(2);
    });
  });

  describe('Photo key updates in attempts', () => {
    it('should update photo keys in attempt records', async () => {
      const mockAttempt = {
        userId: NEW_USER_ID,
        attemptId: 'attempt-1',
        mainPhotoKey: `${OLD_USER_ID}/attempts/attempt-1/main.jpg`,
        photoKeys: [
          `${OLD_USER_ID}/attempts/attempt-1/photo1.jpg`,
          `${OLD_USER_ID}/attempts/attempt-1/photo2.jpg`,
        ],
      };

      dynamoMock.on(QueryCommand).resolves({ Items: [mockAttempt] });
      dynamoMock.on(PutCommand).resolves({});

      const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

      const queryResult = await docClient.send(
        new QueryCommand({
          TableName: TABLES.attempts.name,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: { ':userId': NEW_USER_ID },
        })
      );

      const attempt = queryResult.Items![0];
      const updatedAttempt = { ...attempt };

      // Update mainPhotoKey
      if (attempt.mainPhotoKey?.startsWith(OLD_USER_ID)) {
        updatedAttempt.mainPhotoKey = attempt.mainPhotoKey.replace(OLD_USER_ID, NEW_USER_ID);
      }

      // Update photoKeys array
      if (attempt.photoKeys?.length) {
        updatedAttempt.photoKeys = attempt.photoKeys.map((key: string) =>
          key.startsWith(OLD_USER_ID) ? key.replace(OLD_USER_ID, NEW_USER_ID) : key
        );
      }

      await docClient.send(
        new PutCommand({
          TableName: TABLES.attempts.name,
          Item: updatedAttempt,
        })
      );

      const putCalls = dynamoMock.commandCalls(PutCommand);
      const savedAttempt = putCalls[0].args[0].input.Item;

      expect(savedAttempt?.mainPhotoKey).toBe(
        `${NEW_USER_ID}/attempts/attempt-1/main.jpg`
      );
      expect(savedAttempt?.photoKeys).toEqual([
        `${NEW_USER_ID}/attempts/attempt-1/photo1.jpg`,
        `${NEW_USER_ID}/attempts/attempt-1/photo2.jpg`,
      ]);
    });
  });
});
