export type ItemType = 'batter' | 'frosting' | 'filling' | 'dough' | 'glaze' | 'other';

export type ContainerType = 'round_cake_tin' | 'square_cake_tin' | 'loaf_tin' | 'bundt_tin' | 'sheet_pan' | 'muffin_tin' | 'other';

export type MuffinCupSize = 'mini' | 'standard' | 'jumbo';

export type AttemptStatus = 'planning' | 'baking' | 'done';

export interface ContainerInfo {
  type: ContainerType;
  count: number;     // number of containers/trays

  // Type-specific sizing (use the appropriate one based on type):
  // For round_cake_tin, square_cake_tin, other: diameter/side in inches
  size?: number;

  // For loaf_tin, sheet_pan: length × width in inches
  length?: number;
  width?: number;

  // For bundt_tin: capacity in cups
  capacity?: number;

  // For muffin_tin: cup size and cups per tray
  cupSize?: MuffinCupSize;
  cupsPerTray?: number;  // 6, 12, 24 cups per tray
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
  supplierId?: string;      // key from SUPPLIERS map (e.g., 'cupcake-jemma')
  // Store-bought recipe fields
  isStoreBought?: boolean;      // true if this is a purchased product, not homemade
  brand?: string;               // e.g., "Bonne Maman"
  productName?: string;         // e.g., "Raspberry Conserve"
  purchaseQuantity?: string;    // e.g., "370"
  purchaseUnit?: string;        // e.g., "g"
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
  shoppingListEnabled?: boolean;   // Whether shopping list mode is active
  stockedIngredients?: string[];   // Ingredient names marked as "have it"
  measurementEnabled?: boolean;    // Whether measurement mode is active
  measuredIngredients?: string[];  // Ingredient names marked as "measured"
  // Store-bought usage fields
  usageQuantity?: number;  // how much to use (e.g., 150)
  usageUnit?: string;      // unit for usage (e.g., "g") - defaults to purchaseUnit
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
  aiAdvice?: AiAdviceResponse;  // Saved Crumb advice (persisted, one request per bake)
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
  supplierId?: string | null;
  // Store-bought recipe fields
  isStoreBought?: boolean;
  brand?: string;
  productName?: string;
  purchaseQuantity?: string;
  purchaseUnit?: string;
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
  supplierId?: string | null;
  // Store-bought recipe fields
  isStoreBought?: boolean;
  brand?: string | null;
  productName?: string | null;
  purchaseQuantity?: string | null;
  purchaseUnit?: string | null;
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

// AI Container Scale types
export interface AiContainerScaleRequest {
  sourceContainer: ContainerInfo;
  targetContainer: ContainerInfo;
  context: {
    itemName: string;
    itemType: ItemType;
    recipeName: string;
    ingredients: Ingredient[];
    bakeTime?: number;
    bakeTemp?: number;
    bakeTempUnit?: 'F' | 'C';
  };
}

export interface AiContainerScaleTip {
  title: string;
  suggestion: string;
}

export interface AiContainerScaleResponse {
  scaleFactor: number;
  scaleFactorDisplay: string;    // "x1.78" or "almost double"
  explanation: string;           // Crumb's friendly explanation
  tips: AiContainerScaleTip[];
  adjustedBakeTime?: number;
  adjustedBakeTemp?: number;
  adjustedBakeTempUnit?: 'F' | 'C';
  warning?: string;              // For extreme scaling
  generatedAt: string;
}

// Crumb Chat types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CrumbChatRequest {
  message: string;
  chatHistory: ChatMessage[];
  context: {
    attemptName: string;
    focusedItem: {
      itemName: string;
      recipeName: string;
      variantName?: string;
      scaleFactor?: number;
      ingredients: Ingredient[];
      prepNotes?: string;       // Recipe method/instructions
      variantNotes?: string;    // Variant-specific notes
      bakeTime?: number;
      bakeTemp?: number;
      bakeTempUnit?: 'F' | 'C';
    };
    otherItems: string[];
  };
}

export interface CrumbChatResponse {
  reply: string;
}

// API Response wrappers
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface ListResponse<T> {
  items: T[];
}

// User Preferences types (extensible)
export interface UserPreferences {
  userId: string;
  name?: string;
  temperatureUnit: 'F' | 'C';
  // Future fields (add as needed):
  // language?: string;
  // measurementSystem?: 'metric' | 'imperial';
  // theme?: 'light' | 'dark' | 'system';
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePreferencesRequest {
  name?: string;
  temperatureUnit?: 'F' | 'C';
  // Future: add new preference fields here
}

// Ingredient Suggestions types
export type IngredientCategory =
  | 'flour'
  | 'sugar'
  | 'dairy'
  | 'eggs'
  | 'leavening'
  | 'flavoring'
  | 'chocolate'
  | 'nuts'
  | 'fruit'
  | 'spices'
  | 'fats'
  | 'other';

export interface IngredientSuggestion {
  name: string;
  category: IngredientCategory;
}

export interface IngredientsData {
  version: number;
  ingredients: IngredientSuggestion[];
}

export interface IngredientSubmission {
  submissionId: string;
  name: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface SubmitIngredientRequest {
  name: string;
}
