import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import {
  listItems,
  getItemById,
  createItem,
  updateItemById,
  deleteItemById,
} from './handlers/items';
import {
  listRecipes,
  getRecipeById,
  createRecipe,
  updateRecipeById,
  deleteRecipeById,
} from './handlers/recipes';
import {
  listVariants,
  getVariantById,
  createVariant,
  updateVariantById,
  deleteVariantById,
} from './handlers/variants';
import {
  listAttempts,
  getAttemptById,
  createAttempt,
  updateAttemptById,
  deleteAttemptById,
  captureAttempt,
} from './handlers/attempts';
import {
  listProofedItems,
  getProofedItemById,
  updateProofedItemById,
  deleteProofedItemById,
} from './handlers/proofed-items';
import { getUploadUrl, getDownloadUrl } from './handlers/photos';

function response(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

function parseBody<T>(event: APIGatewayProxyEventV2): T {
  if (!event.body) {
    throw new Error('Request body is required');
  }
  return JSON.parse(event.body) as T;
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const { routeKey, pathParameters } = event;
  const method = event.requestContext.http.method;
  const path = event.rawPath;

  try {
    // Items routes
    if (path === '/items' && method === 'GET') {
      const items = await listItems();
      return response(200, { items });
    }

    if (path === '/items' && method === 'POST') {
      const item = await createItem(parseBody(event));
      return response(201, item);
    }

    if (path.match(/^\/items\/[^/]+$/) && method === 'GET') {
      const itemId = pathParameters?.itemId!;
      const item = await getItemById(itemId);
      if (!item) return response(404, { error: 'Item not found' });
      return response(200, item);
    }

    if (path.match(/^\/items\/[^/]+$/) && method === 'PUT') {
      const itemId = pathParameters?.itemId!;
      const item = await updateItemById(itemId, parseBody(event));
      if (!item) return response(404, { error: 'Item not found' });
      return response(200, item);
    }

    if (path.match(/^\/items\/[^/]+$/) && method === 'DELETE') {
      const itemId = pathParameters?.itemId!;
      await deleteItemById(itemId);
      return response(204, null);
    }

    // Recipes routes
    if (path.match(/^\/items\/[^/]+\/recipes$/) && method === 'GET') {
      const itemId = pathParameters?.itemId!;
      const recipes = await listRecipes(itemId);
      return response(200, { items: recipes });
    }

    if (path.match(/^\/items\/[^/]+\/recipes$/) && method === 'POST') {
      const itemId = pathParameters?.itemId!;
      const recipe = await createRecipe(itemId, parseBody(event));
      return response(201, recipe);
    }

    if (path.match(/^\/items\/[^/]+\/recipes\/[^/]+$/) && method === 'GET') {
      const recipeId = pathParameters?.recipeId!;
      const recipe = await getRecipeById(recipeId);
      if (!recipe) return response(404, { error: 'Recipe not found' });
      return response(200, recipe);
    }

    if (path.match(/^\/items\/[^/]+\/recipes\/[^/]+$/) && method === 'PUT') {
      const recipeId = pathParameters?.recipeId!;
      const recipe = await updateRecipeById(recipeId, parseBody(event));
      if (!recipe) return response(404, { error: 'Recipe not found' });
      return response(200, recipe);
    }

    if (path.match(/^\/items\/[^/]+\/recipes\/[^/]+$/) && method === 'DELETE') {
      const recipeId = pathParameters?.recipeId!;
      await deleteRecipeById(recipeId);
      return response(204, null);
    }

    // Variants routes
    if (path.match(/^\/items\/[^/]+\/recipes\/[^/]+\/variants$/) && method === 'GET') {
      const recipeId = pathParameters?.recipeId!;
      const variants = await listVariants(recipeId);
      return response(200, { items: variants });
    }

    if (path.match(/^\/items\/[^/]+\/recipes\/[^/]+\/variants$/) && method === 'POST') {
      const itemId = pathParameters?.itemId!;
      const recipeId = pathParameters?.recipeId!;
      const variant = await createVariant(itemId, recipeId, parseBody(event));
      return response(201, variant);
    }

    if (path.match(/^\/items\/[^/]+\/recipes\/[^/]+\/variants\/[^/]+$/) && method === 'GET') {
      const variantId = pathParameters?.variantId!;
      const variant = await getVariantById(variantId);
      if (!variant) return response(404, { error: 'Variant not found' });
      return response(200, variant);
    }

    if (path.match(/^\/items\/[^/]+\/recipes\/[^/]+\/variants\/[^/]+$/) && method === 'PUT') {
      const variantId = pathParameters?.variantId!;
      const variant = await updateVariantById(variantId, parseBody(event));
      if (!variant) return response(404, { error: 'Variant not found' });
      return response(200, variant);
    }

    if (path.match(/^\/items\/[^/]+\/recipes\/[^/]+\/variants\/[^/]+$/) && method === 'DELETE') {
      const variantId = pathParameters?.variantId!;
      await deleteVariantById(variantId);
      return response(204, null);
    }

    // Attempts routes
    if (path === '/attempts' && method === 'GET') {
      const attempts = await listAttempts();
      return response(200, { items: attempts });
    }

    if (path === '/attempts' && method === 'POST') {
      const attempt = await createAttempt(parseBody(event));
      return response(201, attempt);
    }

    if (path.match(/^\/attempts\/[^/]+$/) && method === 'GET') {
      const attemptId = pathParameters?.attemptId!;
      const attempt = await getAttemptById(attemptId);
      if (!attempt) return response(404, { error: 'Attempt not found' });
      return response(200, attempt);
    }

    if (path.match(/^\/attempts\/[^/]+$/) && method === 'PUT') {
      const attemptId = pathParameters?.attemptId!;
      const attempt = await updateAttemptById(attemptId, parseBody(event));
      if (!attempt) return response(404, { error: 'Attempt not found' });
      return response(200, attempt);
    }

    if (path.match(/^\/attempts\/[^/]+$/) && method === 'DELETE') {
      const attemptId = pathParameters?.attemptId!;
      await deleteAttemptById(attemptId);
      return response(204, null);
    }

    if (path.match(/^\/attempts\/[^/]+\/capture$/) && method === 'POST') {
      const attemptId = pathParameters?.attemptId!;
      const proofedItem = await captureAttempt(attemptId, parseBody(event));
      return response(201, proofedItem);
    }

    // Proofed Items routes
    if (path === '/proofed-items' && method === 'GET') {
      const proofedItems = await listProofedItems();
      return response(200, { items: proofedItems });
    }

    if (path.match(/^\/proofed-items\/[^/]+$/) && method === 'GET') {
      const proofedItemId = pathParameters?.proofedItemId!;
      const proofedItem = await getProofedItemById(proofedItemId);
      if (!proofedItem) return response(404, { error: 'Proofed item not found' });
      return response(200, proofedItem);
    }

    if (path.match(/^\/proofed-items\/[^/]+$/) && method === 'PUT') {
      const proofedItemId = pathParameters?.proofedItemId!;
      const proofedItem = await updateProofedItemById(proofedItemId, parseBody(event));
      if (!proofedItem) return response(404, { error: 'Proofed item not found' });
      return response(200, proofedItem);
    }

    if (path.match(/^\/proofed-items\/[^/]+$/) && method === 'DELETE') {
      const proofedItemId = pathParameters?.proofedItemId!;
      await deleteProofedItemById(proofedItemId);
      return response(204, null);
    }

    // Photos routes
    if (path === '/photos/upload-url' && method === 'POST') {
      const result = await getUploadUrl(parseBody(event));
      return response(200, result);
    }

    if (path === '/photos/download-url' && method === 'POST') {
      const result = await getDownloadUrl(parseBody(event));
      return response(200, result);
    }

    return response(404, { error: 'Not found' });
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return response(500, { error: message });
  }
}
