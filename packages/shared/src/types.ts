export type ItemType = 'batter' | 'frosting' | 'filling' | 'dough' | 'glaze' | 'other';

export type ContainerType = 'round_cake_tin' | 'square_cake_tin' | 'loaf_tin' | 'bundt_tin' | 'sheet_pan' | 'muffin_tin' | 'other';

export type AttemptStatus = 'planning' | 'baking' | 'done';

export interface ContainerInfo {
  type: ContainerType;
  size: number;      // in inches
  count: number;     // number of containers
}

export interface Item {
  itemId: string;
  userId: string;
  name: string;
  type: ItemType;
  notes?: string;
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
  bakeTime?: number;        // minutes
  bakeTemp?: number;        // temperature value
  bakeTempUnit?: 'F' | 'C'; // Fahrenheit or Celsius
  customScales?: number[];  // custom scale factors (e.g., [0.75, 1.25, 3])
  container?: ContainerInfo; // container type, size, and count
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
  bakeTime?: number;        // override recipe bake time
  bakeTemp?: number;        // override recipe temperature
  bakeTempUnit?: 'F' | 'C'; // override temperature unit
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
  itemUsages: ItemUsage[];
  notes?: string;
  outcomeNotes?: string;
  photoKeys?: string[];
  mainPhotoKey?: string;  // Key of the photo to display on home screen
  status?: AttemptStatus;  // 'planning' | 'baking' | 'done'
  starred?: boolean;       // Whether this attempt is starred/favorited
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
}

export interface UpdateItemRequest {
  name?: string;
  type?: ItemType;
  notes?: string;
}

export interface CreateRecipeRequest {
  name: string;
  ingredients: Ingredient[];
  prepNotes?: string;
  bakeTime?: number;
  bakeTemp?: number;
  bakeTempUnit?: 'F' | 'C';
  customScales?: number[];
  container?: ContainerInfo;
}

export interface UpdateRecipeRequest {
  name?: string;
  ingredients?: Ingredient[];
  prepNotes?: string;
  bakeTime?: number;
  bakeTemp?: number;
  bakeTempUnit?: 'F' | 'C';
  customScales?: number[];
  container?: ContainerInfo;
}

export interface CreateVariantRequest {
  name: string;
  ingredientOverrides: Ingredient[];
  bakeTime?: number;
  bakeTemp?: number;
  bakeTempUnit?: 'F' | 'C';
  notes?: string;
}

export interface UpdateVariantRequest {
  name?: string;
  ingredientOverrides?: Ingredient[];
  bakeTime?: number;
  bakeTemp?: number;
  bakeTempUnit?: 'F' | 'C';
  notes?: string;
}

export interface CreateAttemptRequest {
  name: string;
  date: string;
  itemUsages: ItemUsage[];
  notes?: string;
  status?: AttemptStatus;  // defaults to 'planning'
}

export interface UpdateAttemptRequest {
  name?: string;
  date?: string;
  itemUsages?: ItemUsage[];
  notes?: string;
  outcomeNotes?: string;
  photoKeys?: string[];
  mainPhotoKey?: string;
  status?: AttemptStatus;
  starred?: boolean;
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

export interface PhotoDownloadRequest {
  key: string;
}

export interface PhotoDownloadResponse {
  downloadUrl: string;
}

// AI Advice types
export interface AiAdviceTip {
  title: string;
  suggestion: string;
  itemUsageIndex: number;  // Which item this tip applies to (index in itemUsages array)
  ingredientOverrides?: Ingredient[];  // Specific ingredient changes with quantities
  bakeTime?: number;       // Optional bake time override
  bakeTemp?: number;       // Optional bake temp override
  bakeTempUnit?: 'F' | 'C';
}

export interface AiAdviceRequest {
  outcomeNotes: string;
  photoUrl?: string;  // URL to the main photo for visual analysis
  context: {
    attemptName: string;
    itemUsages: Array<{
      itemName: string;
      recipeName: string;
      variantName?: string;
      scaleFactor?: number;
      ingredients: Ingredient[];
      bakeTime?: number;        // minutes
      bakeTemp?: number;        // temperature value
      bakeTempUnit?: 'F' | 'C'; // Fahrenheit or Celsius
    }>;
  };
}

export interface AiAdviceResponse {
  overview: string;  // Friendly, informal reaction to the bake
  tips: AiAdviceTip[];
  generatedAt: string;
}

// API Response wrappers
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface ListResponse<T> {
  items: T[];
}
