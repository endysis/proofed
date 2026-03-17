import type { Attempt, Item, ItemType, ProofedItem } from '@proofed/shared';

// ─── Badge Definitions ────────────────────────────────────────────

export type BadgeCategory = 'milestone' | 'streak' | 'quality' | 'photo' | 'variety' | 'proofed';

export interface BadgeDefinition {
  id: string;
  name: string;
  icon: string;
  category: BadgeCategory;
  description: string;
  check: (ctx: BadgeContext) => BadgeProgress;
}

export interface BadgeProgress {
  earned: boolean;
  current: number;
  target: number;
}

export interface EarnedBadge {
  badge: BadgeDefinition;
  earnedAt: string; // ISO date string of when the threshold was first met
  isNew: boolean;
}

export interface BadgeContext {
  completedAttempts: Attempt[];
  allAttempts: Attempt[];
  items: Item[];
  proofedItems: ProofedItem[];
  currentStreak: number;
}

function countBakes(ctx: BadgeContext): number {
  return ctx.completedAttempts.length;
}

function countFiveStars(ctx: BadgeContext): number {
  return ctx.completedAttempts.filter((a) => a.rating === 5).length;
}

function countPhotoBakes(ctx: BadgeContext): number {
  return ctx.completedAttempts.filter(
    (a) => a.photoKeys && a.photoKeys.length > 0
  ).length;
}

function countUniqueItemTypes(ctx: BadgeContext): number {
  const itemMap = new Map(ctx.items.map((i) => [i.itemId, i]));
  const types = new Set<ItemType>();
  ctx.completedAttempts.forEach((a) => {
    a.itemUsages.forEach((u) => {
      const item = itemMap.get(u.itemId);
      if (item) types.add(item.type);
    });
  });
  return types.size;
}

function countBakesByType(ctx: BadgeContext, type: ItemType): number {
  const itemMap = new Map(ctx.items.map((i) => [i.itemId, i]));
  const attemptIds = new Set<string>();
  ctx.completedAttempts.forEach((a) => {
    a.itemUsages.forEach((u) => {
      const item = itemMap.get(u.itemId);
      if (item?.type === type) attemptIds.add(a.attemptId);
    });
  });
  return attemptIds.size;
}

export const BADGES: BadgeDefinition[] = [
  // Milestone badges
  {
    id: 'first-bake',
    name: 'First Rise',
    icon: 'bakery_dining',
    category: 'milestone',
    description: 'Complete your first bake',
    check: (ctx) => ({ earned: countBakes(ctx) >= 1, current: countBakes(ctx), target: 1 }),
  },
  {
    id: 'fifth-bake',
    name: 'High Five',
    icon: 'cake',
    category: 'milestone',
    description: 'Complete 5 bakes',
    check: (ctx) => ({ earned: countBakes(ctx) >= 5, current: Math.min(countBakes(ctx), 5), target: 5 }),
  },
  {
    id: 'tenth-bake',
    name: 'Golden Whisk',
    icon: 'emoji_events',
    category: 'milestone',
    description: 'Complete 10 bakes',
    check: (ctx) => ({ earned: countBakes(ctx) >= 10, current: Math.min(countBakes(ctx), 10), target: 10 }),
  },
  {
    id: 'twenty-fifth-bake',
    name: 'Oven Master',
    icon: 'local_fire_department',
    category: 'milestone',
    description: 'Complete 25 bakes',
    check: (ctx) => ({ earned: countBakes(ctx) >= 25, current: Math.min(countBakes(ctx), 25), target: 25 }),
  },
  {
    id: 'fiftieth-bake',
    name: 'Flour Power',
    icon: 'workspace_premium',
    category: 'milestone',
    description: 'Complete 50 bakes',
    check: (ctx) => ({ earned: countBakes(ctx) >= 50, current: Math.min(countBakes(ctx), 50), target: 50 }),
  },
  {
    id: 'hundredth-bake',
    name: 'Century Baker',
    icon: 'military_tech',
    category: 'milestone',
    description: 'Complete 100 bakes',
    check: (ctx) => ({ earned: countBakes(ctx) >= 100, current: Math.min(countBakes(ctx), 100), target: 100 }),
  },

  // Streak badges
  {
    id: 'streak-2',
    name: 'Steady Hands',
    icon: 'trending_up',
    category: 'streak',
    description: 'Bake for 2 weeks in a row',
    check: (ctx) => ({ earned: ctx.currentStreak >= 2, current: Math.min(ctx.currentStreak, 2), target: 2 }),
  },
  {
    id: 'streak-4',
    name: 'Hot Streak',
    icon: 'whatshot',
    category: 'streak',
    description: 'Bake for 4 weeks in a row',
    check: (ctx) => ({ earned: ctx.currentStreak >= 4, current: Math.min(ctx.currentStreak, 4), target: 4 }),
  },
  {
    id: 'streak-8',
    name: 'Iron Oven',
    icon: 'shield',
    category: 'streak',
    description: 'Bake for 8 weeks in a row',
    check: (ctx) => ({ earned: ctx.currentStreak >= 8, current: Math.min(ctx.currentStreak, 8), target: 8 }),
  },

  // Quality badges
  {
    id: 'first-five-star',
    name: 'Crust King',
    icon: 'star',
    category: 'quality',
    description: 'Get your first 5-star rating',
    check: (ctx) => ({ earned: countFiveStars(ctx) >= 1, current: countFiveStars(ctx), target: 1 }),
  },
  {
    id: 'five-five-stars',
    name: 'Perfectionist',
    icon: 'verified',
    category: 'quality',
    description: 'Get 5 five-star ratings',
    check: (ctx) => ({ earned: countFiveStars(ctx) >= 5, current: Math.min(countFiveStars(ctx), 5), target: 5 }),
  },

  // Photo badge
  {
    id: 'first-photo',
    name: 'Snap Happy',
    icon: 'photo_camera',
    category: 'photo',
    description: 'Add a photo to a bake',
    check: (ctx) => ({ earned: countPhotoBakes(ctx) >= 1, current: countPhotoBakes(ctx), target: 1 }),
  },

  // Variety badges
  {
    id: 'variety-3',
    name: 'Explorer',
    icon: 'explore',
    category: 'variety',
    description: 'Bake 3 different item types',
    check: (ctx) => ({ earned: countUniqueItemTypes(ctx) >= 3, current: Math.min(countUniqueItemTypes(ctx), 3), target: 3 }),
  },
  {
    id: 'dough-5',
    name: 'Bread Master',
    icon: 'bakery_dining',
    category: 'variety',
    description: 'Complete 5 dough bakes',
    check: (ctx) => {
      const c = countBakesByType(ctx, 'dough');
      return { earned: c >= 5, current: Math.min(c, 5), target: 5 };
    },
  },
  {
    id: 'batter-5',
    name: 'Sweet Tooth',
    icon: 'icecream',
    category: 'variety',
    description: 'Complete 5 batter bakes',
    check: (ctx) => {
      const c = countBakesByType(ctx, 'batter');
      return { earned: c >= 5, current: Math.min(c, 5), target: 5 };
    },
  },
  {
    id: 'frosting-5',
    name: 'Icing Artist',
    icon: 'palette',
    category: 'variety',
    description: 'Complete 5 frosting bakes',
    check: (ctx) => {
      const c = countBakesByType(ctx, 'frosting');
      return { earned: c >= 5, current: Math.min(c, 5), target: 5 };
    },
  },
  {
    id: 'filling-5',
    name: 'Filling Pro',
    icon: 'pie_chart',
    category: 'variety',
    description: 'Complete 5 filling bakes',
    check: (ctx) => {
      const c = countBakesByType(ctx, 'filling');
      return { earned: c >= 5, current: Math.min(c, 5), target: 5 };
    },
  },

  // Proofed badge
  {
    id: 'first-proofed',
    name: 'Proven Recipe',
    icon: 'check_circle',
    category: 'proofed',
    description: 'Capture your first proofed item',
    check: (ctx) => ({
      earned: ctx.proofedItems.length >= 1,
      current: ctx.proofedItems.length,
      target: 1,
    }),
  },
];

// ─── Level System ─────────────────────────────────────────────────

export interface LevelDefinition {
  level: number;
  nibsRequired: number;
  title: string;
  heroIcon: string;
}

export const LEVELS: LevelDefinition[] = [
  { level: 1, nibsRequired: 0, title: 'Novice Baker', heroIcon: 'cookie' },
  { level: 2, nibsRequired: 30, title: 'Kitchen Helper', heroIcon: 'cookie' },
  { level: 3, nibsRequired: 70, title: 'Mixing Bowl', heroIcon: 'blender' },
  { level: 4, nibsRequired: 120, title: 'Dough Starter', heroIcon: 'blender' },
  { level: 5, nibsRequired: 200, title: 'Apprentice Baker', heroIcon: 'bakery_dining' },
  { level: 6, nibsRequired: 300, title: 'Rising Star', heroIcon: 'bakery_dining' },
  { level: 7, nibsRequired: 420, title: 'Pastry Student', heroIcon: 'cake' },
  { level: 8, nibsRequired: 560, title: 'Oven Tender', heroIcon: 'cake' },
  { level: 9, nibsRequired: 720, title: 'Bread Winner', heroIcon: 'lunch_dining' },
  { level: 10, nibsRequired: 900, title: 'Journeyman Baker', heroIcon: 'lunch_dining' },
  { level: 11, nibsRequired: 1100, title: 'Crust Crafter', heroIcon: 'restaurant' },
  { level: 12, nibsRequired: 1350, title: 'Master Baker', heroIcon: 'restaurant' },
  { level: 13, nibsRequired: 1650, title: 'Head Baker', heroIcon: 'emoji_events' },
  { level: 14, nibsRequired: 2000, title: 'Pastry Chef', heroIcon: 'emoji_events' },
  { level: 15, nibsRequired: 2400, title: 'Artisan Baker', heroIcon: 'workspace_premium' },
  { level: 16, nibsRequired: 2850, title: 'Sourdough Sage', heroIcon: 'workspace_premium' },
  { level: 17, nibsRequired: 3350, title: 'Baking Virtuoso', heroIcon: 'military_tech' },
  { level: 18, nibsRequired: 3900, title: 'Grand Baker', heroIcon: 'military_tech' },
  { level: 19, nibsRequired: 4500, title: 'Legendary Baker', heroIcon: 'military_tech' },
  { level: 20, nibsRequired: 5200, title: 'Baking Legend', heroIcon: 'military_tech' },
];

// ─── Nib Rewards ──────────────────────────────────────────────────

export const NIBS = {
  completeBake: 10,
  rateBake: 5,
  addPhoto: 3,
  earnBadge: 25,
  proofRecipe: 15,
} as const;

// ─── Helpers ──────────────────────────────────────────────────────

export function getLevelForNibs(nibs: number): LevelDefinition {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (nibs >= LEVELS[i].nibsRequired) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getNibsToNextLevel(nibs: number): number | null {
  const currentLevel = getLevelForNibs(nibs);
  const nextLevel = LEVELS.find((l) => l.level === currentLevel.level + 1);
  if (!nextLevel) return null; // Max level
  return nextLevel.nibsRequired - nibs;
}

export function getNextLevel(nibs: number): LevelDefinition | null {
  const currentLevel = getLevelForNibs(nibs);
  return LEVELS.find((l) => l.level === currentLevel.level + 1) || null;
}

export function getLevelProgress(nibs: number): number {
  const currentLevel = getLevelForNibs(nibs);
  const nextLevel = getNextLevel(nibs);
  if (!nextLevel) return 1; // Max level = full bar
  const nibsIntoLevel = nibs - currentLevel.nibsRequired;
  const nibsForLevel = nextLevel.nibsRequired - currentLevel.nibsRequired;
  return nibsForLevel > 0 ? nibsIntoLevel / nibsForLevel : 1;
}
