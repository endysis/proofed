import type {
  Item,
  Recipe,
  Variant,
  Attempt,
  ProofedItem,
  CreateItemRequest,
  UpdateItemRequest,
  CreateRecipeRequest,
  UpdateRecipeRequest,
  CreateVariantRequest,
  UpdateVariantRequest,
  CreateAttemptRequest,
  UpdateAttemptRequest,
  CaptureAttemptRequest,
  UpdateProofedItemRequest,
  PhotoUploadRequest,
  PhotoUploadResponse,
} from '@proofed/shared';

const DEFAULT_USER_ID = 'default-user';

function ulid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function getStore<T>(key: string): T[] {
  const data = localStorage.getItem(`proofed_${key}`);
  return data ? JSON.parse(data) : [];
}

function setStore<T>(key: string, data: T[]): void {
  localStorage.setItem(`proofed_${key}`, JSON.stringify(data));
}

// Items
export const mockItemsApi = {
  list: async (): Promise<Item[]> => {
    await delay();
    return getStore<Item>('items');
  },

  get: async (itemId: string): Promise<Item> => {
    await delay();
    const items = getStore<Item>('items');
    const item = items.find((i) => i.itemId === itemId);
    if (!item) throw new Error('Item not found');
    return item;
  },

  create: async (data: CreateItemRequest): Promise<Item> => {
    await delay();
    const now = new Date().toISOString();
    const item: Item = {
      itemId: ulid(),
      userId: DEFAULT_USER_ID,
      name: data.name,
      type: data.type,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };
    const items = getStore<Item>('items');
    items.push(item);
    setStore('items', items);
    return item;
  },

  update: async (itemId: string, data: UpdateItemRequest): Promise<Item> => {
    await delay();
    const items = getStore<Item>('items');
    const index = items.findIndex((i) => i.itemId === itemId);
    if (index === -1) throw new Error('Item not found');
    items[index] = {
      ...items[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    setStore('items', items);
    return items[index];
  },

  delete: async (itemId: string): Promise<void> => {
    await delay();
    const items = getStore<Item>('items');
    setStore('items', items.filter((i) => i.itemId !== itemId));
  },
};

// Recipes
export const mockRecipesApi = {
  list: async (itemId: string): Promise<Recipe[]> => {
    await delay();
    const recipes = getStore<Recipe>('recipes');
    return recipes.filter((r) => r.itemId === itemId);
  },

  get: async (_itemId: string, recipeId: string): Promise<Recipe> => {
    await delay();
    const recipes = getStore<Recipe>('recipes');
    const recipe = recipes.find((r) => r.recipeId === recipeId);
    if (!recipe) throw new Error('Recipe not found');
    return recipe;
  },

  create: async (itemId: string, data: CreateRecipeRequest): Promise<Recipe> => {
    await delay();
    const now = new Date().toISOString();
    const recipe: Recipe = {
      recipeId: ulid(),
      userId: DEFAULT_USER_ID,
      itemId,
      name: data.name,
      ingredients: data.ingredients,
      prepNotes: data.prepNotes,
      createdAt: now,
      updatedAt: now,
    };
    const recipes = getStore<Recipe>('recipes');
    recipes.push(recipe);
    setStore('recipes', recipes);
    return recipe;
  },

  update: async (_itemId: string, recipeId: string, data: UpdateRecipeRequest): Promise<Recipe> => {
    await delay();
    const recipes = getStore<Recipe>('recipes');
    const index = recipes.findIndex((r) => r.recipeId === recipeId);
    if (index === -1) throw new Error('Recipe not found');
    recipes[index] = {
      ...recipes[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    setStore('recipes', recipes);
    return recipes[index];
  },

  delete: async (_itemId: string, recipeId: string): Promise<void> => {
    await delay();
    const recipes = getStore<Recipe>('recipes');
    setStore('recipes', recipes.filter((r) => r.recipeId !== recipeId));
  },
};

// Variants
export const mockVariantsApi = {
  list: async (_itemId: string, recipeId: string): Promise<Variant[]> => {
    await delay();
    const variants = getStore<Variant>('variants');
    return variants.filter((v) => v.recipeId === recipeId);
  },

  get: async (_itemId: string, _recipeId: string, variantId: string): Promise<Variant> => {
    await delay();
    const variants = getStore<Variant>('variants');
    const variant = variants.find((v) => v.variantId === variantId);
    if (!variant) throw new Error('Variant not found');
    return variant;
  },

  create: async (itemId: string, recipeId: string, data: CreateVariantRequest): Promise<Variant> => {
    await delay();
    const now = new Date().toISOString();
    const variant: Variant = {
      variantId: ulid(),
      userId: DEFAULT_USER_ID,
      recipeId,
      itemId,
      name: data.name,
      ingredientOverrides: data.ingredientOverrides,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };
    const variants = getStore<Variant>('variants');
    variants.push(variant);
    setStore('variants', variants);
    return variant;
  },

  update: async (
    _itemId: string,
    _recipeId: string,
    variantId: string,
    data: UpdateVariantRequest
  ): Promise<Variant> => {
    await delay();
    const variants = getStore<Variant>('variants');
    const index = variants.findIndex((v) => v.variantId === variantId);
    if (index === -1) throw new Error('Variant not found');
    variants[index] = {
      ...variants[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    setStore('variants', variants);
    return variants[index];
  },

  delete: async (_itemId: string, _recipeId: string, variantId: string): Promise<void> => {
    await delay();
    const variants = getStore<Variant>('variants');
    setStore('variants', variants.filter((v) => v.variantId !== variantId));
  },
};

// Attempts
export const mockAttemptsApi = {
  list: async (): Promise<Attempt[]> => {
    await delay();
    return getStore<Attempt>('attempts');
  },

  get: async (attemptId: string): Promise<Attempt> => {
    await delay();
    const attempts = getStore<Attempt>('attempts');
    const attempt = attempts.find((a) => a.attemptId === attemptId);
    if (!attempt) throw new Error('Attempt not found');
    return attempt;
  },

  create: async (data: CreateAttemptRequest): Promise<Attempt> => {
    await delay();
    const now = new Date().toISOString();
    const attempt: Attempt = {
      attemptId: ulid(),
      userId: DEFAULT_USER_ID,
      name: data.name,
      date: data.date,
      ovenTemp: data.ovenTemp,
      ovenTempUnit: data.ovenTempUnit,
      bakeTime: data.bakeTime,
      itemUsages: data.itemUsages,
      notes: data.notes,
      createdAt: now,
    };
    const attempts = getStore<Attempt>('attempts');
    attempts.push(attempt);
    setStore('attempts', attempts);
    return attempt;
  },

  update: async (attemptId: string, data: UpdateAttemptRequest): Promise<Attempt> => {
    await delay();
    const attempts = getStore<Attempt>('attempts');
    const index = attempts.findIndex((a) => a.attemptId === attemptId);
    if (index === -1) throw new Error('Attempt not found');
    attempts[index] = {
      ...attempts[index],
      ...data,
    };
    setStore('attempts', attempts);
    return attempts[index];
  },

  delete: async (attemptId: string): Promise<void> => {
    await delay();
    const attempts = getStore<Attempt>('attempts');
    setStore('attempts', attempts.filter((a) => a.attemptId !== attemptId));
  },

  capture: async (attemptId: string, data: CaptureAttemptRequest): Promise<ProofedItem> => {
    await delay();
    const attempts = getStore<Attempt>('attempts');
    const attempt = attempts.find((a) => a.attemptId === attemptId);
    if (!attempt) throw new Error('Attempt not found');

    const now = new Date().toISOString();
    const proofedItem: ProofedItem = {
      proofedItemId: ulid(),
      userId: DEFAULT_USER_ID,
      name: data.name,
      capturedFromAttemptId: attemptId,
      itemConfigs: attempt.itemUsages,
      notes: data.notes,
      createdAt: now,
    };
    const proofedItems = getStore<ProofedItem>('proofedItems');
    proofedItems.push(proofedItem);
    setStore('proofedItems', proofedItems);
    return proofedItem;
  },
};

// Proofed Items
export const mockProofedItemsApi = {
  list: async (): Promise<ProofedItem[]> => {
    await delay();
    return getStore<ProofedItem>('proofedItems');
  },

  get: async (proofedItemId: string): Promise<ProofedItem> => {
    await delay();
    const proofedItems = getStore<ProofedItem>('proofedItems');
    const proofedItem = proofedItems.find((p) => p.proofedItemId === proofedItemId);
    if (!proofedItem) throw new Error('Proofed item not found');
    return proofedItem;
  },

  update: async (proofedItemId: string, data: UpdateProofedItemRequest): Promise<ProofedItem> => {
    await delay();
    const proofedItems = getStore<ProofedItem>('proofedItems');
    const index = proofedItems.findIndex((p) => p.proofedItemId === proofedItemId);
    if (index === -1) throw new Error('Proofed item not found');
    proofedItems[index] = {
      ...proofedItems[index],
      ...data,
    };
    setStore('proofedItems', proofedItems);
    return proofedItems[index];
  },

  delete: async (proofedItemId: string): Promise<void> => {
    await delay();
    const proofedItems = getStore<ProofedItem>('proofedItems');
    setStore('proofedItems', proofedItems.filter((p) => p.proofedItemId !== proofedItemId));
  },
};

// Photos (mock - just returns fake URLs)
export const mockPhotosApi = {
  getUploadUrl: async (data: PhotoUploadRequest): Promise<PhotoUploadResponse> => {
    await delay();
    const key = `mock/${data.attemptId}/${Date.now()}-${data.fileName}`;
    return {
      uploadUrl: `https://mock-s3.local/${key}`,
      key,
    };
  },

  upload: async (_uploadUrl: string, _file: File): Promise<void> => {
    await delay(500);
    // Mock upload - just delay
  },
};

function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
