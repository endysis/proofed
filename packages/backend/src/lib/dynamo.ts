import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export async function putItem<T>(
  tableName: string,
  item: T
): Promise<T> {
  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item as Record<string, unknown>,
    })
  );
  return item;
}

export async function getItem<T>(
  tableName: string,
  key: Record<string, string>
): Promise<T | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: key,
    })
  );
  return (result.Item as T) || null;
}

export async function queryItems<T>(
  tableName: string,
  userId: string
): Promise<T[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    })
  );
  return (result.Items as T[]) || [];
}

export async function queryItemsWithFilter<T>(
  tableName: string,
  userId: string,
  filterExpression: string,
  expressionAttributeValues: Record<string, unknown>,
  expressionAttributeNames?: Record<string, string>
): Promise<T[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: filterExpression,
      ExpressionAttributeValues: {
        ':userId': userId,
        ...expressionAttributeValues,
      },
      ExpressionAttributeNames: expressionAttributeNames,
    })
  );
  return (result.Items as T[]) || [];
}

export async function deleteItem(
  tableName: string,
  key: Record<string, string>
): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: key,
    })
  );
}

export async function updateItem<T>(
  tableName: string,
  key: Record<string, string>,
  updates: Partial<T>
): Promise<T | null> {
  const setExpressionParts: string[] = [];
  const removeExpressionParts: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};

  Object.entries(updates).forEach(([field, value], index) => {
    if (value === undefined) {
      // Skip undefined values entirely
      return;
    }

    const attrName = `#field${index}`;
    expressionAttributeNames[attrName] = field;

    if (value === null) {
      // null means remove the attribute
      removeExpressionParts.push(attrName);
    } else {
      // Non-null value means set the attribute
      const attrValue = `:value${index}`;
      setExpressionParts.push(`${attrName} = ${attrValue}`);
      expressionAttributeValues[attrValue] = value;
    }
  });

  if (setExpressionParts.length === 0 && removeExpressionParts.length === 0) {
    return getItem<T>(tableName, key);
  }

  // Build update expression with SET and/or REMOVE clauses
  const expressionParts: string[] = [];
  if (setExpressionParts.length > 0) {
    expressionParts.push(`SET ${setExpressionParts.join(', ')}`);
  }
  if (removeExpressionParts.length > 0) {
    expressionParts.push(`REMOVE ${removeExpressionParts.join(', ')}`);
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: expressionParts.join(' '),
      ExpressionAttributeNames: expressionAttributeNames,
      ...(Object.keys(expressionAttributeValues).length > 0 && {
        ExpressionAttributeValues: expressionAttributeValues,
      }),
      ReturnValues: 'ALL_NEW',
    })
  );

  return (result.Attributes as T) || null;
}
