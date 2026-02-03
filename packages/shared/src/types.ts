export type ItemType = 'batter' | 'frosting' | 'filling' | 'dough' | 'glaze' | 'other';

export interface Item {
  itemId: string;
  userId: string;
  name: string;
  type: ItemType;
  notes?: string;
  bakeTime?: number;        // minutes
  bakeTemp?: number;        // temperature value
  bakeTempUnit?: 'F' | 'C'; // Fahrenheit or Celsius
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  recipeId: string;
  userId: string;
  itemId: string;
  name: string;
  ingredients: Ingredient[];
  prepNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Variant {
  variantId: string;
  userId: string;
  recipeId: string;
  itemId: string;
  name: string;
  ingredientOverrides: Ingredient[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemUsage {
  itemId: string;
  recipeId: string;
  variantId?: string;
  scaleFactor?: number;  // e.g., 0.5 for half, 2 for double
  notes?: string;
}

export interface Attempt {
  attemptId: string;
  userId: string;
  name: string;
  date: string;
  ovenTemp?: number;
  ovenTempUnit?: 'F' | 'C';
  bakeTime?: number;
  itemUsages: ItemUsage[];
  notes?: string;
  outcomeNotes?: string;
  photoKeys?: string[];
  createdAt: string;
}

export interface ProofedItem {
  proofedItemId: string;
  userId: string;
  name: string;
  capturedFromAttemptId: string;
  itemConfigs: ItemUsage[];
  notes?: string;
  createdAt: string;
}

// API Request/Response types
export interface CreateItemRequest {
  name: string;
  type: ItemType;
  notes?: string;
  bakeTime?: number;
  bakeTemp?: number;
  bakeTempUnit?: 'F' | 'C';
}

export interface UpdateItemRequest {
  name?: string;
  type?: ItemType;
  notes?: string;
  bakeTime?: number;
  bakeTemp?: number;
  bakeTempUnit?: 'F' | 'C';
}

export interface CreateRecipeRequest {
  name: string;
  ingredients: Ingredient[];
  prepNotes?: string;
}

export interface UpdateRecipeRequest {
  name?: string;
  ingredients?: Ingredient[];
  prepNotes?: string;
}

export interface CreateVariantRequest {
  name: string;
  ingredientOverrides: Ingredient[];
  notes?: string;
}

export interface UpdateVariantRequest {
  name?: string;
  ingredientOverrides?: Ingredient[];
  notes?: string;
}

export interface CreateAttemptRequest {
  name: string;
  date: string;
  ovenTemp?: number;
  ovenTempUnit?: 'F' | 'C';
  bakeTime?: number;
  itemUsages: ItemUsage[];
  notes?: string;
}

export interface UpdateAttemptRequest {
  name?: string;
  date?: string;
  ovenTemp?: number;
  ovenTempUnit?: 'F' | 'C';
  bakeTime?: number;
  itemUsages?: ItemUsage[];
  notes?: string;
  outcomeNotes?: string;
  photoKeys?: string[];
}

export interface CaptureAttemptRequest {
  name: string;
  notes?: string;
}

export interface UpdateProofedItemRequest {
  name?: string;
  notes?: string;
}

export interface PhotoUploadRequest {
  attemptId: string;
  fileName: string;
  contentType: string;
}

export interface PhotoUploadResponse {
  uploadUrl: string;
  key: string;
}

// API Response wrappers
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface ListResponse<T> {
  items: T[];
}
