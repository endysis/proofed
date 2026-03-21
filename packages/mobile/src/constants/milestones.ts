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
  title: string;      // Stone name, e.g. "Quartz"
  degree: number;     // 1-4
  heroIcon: string;
  color: string;      // Gem color for UI
}

// 9 stones × 4 degrees = 36 levels
const STONES: Array<{ title: string; color: string; heroIcon: string; nibs: [number, number, number, number] }> = [
  { title: 'Quartz',   color: '#9E9E9E', heroIcon: 'cookie',           nibs: [0, 80, 165, 255] },
  { title: 'Amber',    color: '#FF8F00', heroIcon: 'blender',          nibs: [350, 455, 565, 685] },
  { title: 'Amethyst', color: '#7B1FA2', heroIcon: 'bakery_dining',    nibs: [815, 955, 1105, 1270] },
  { title: 'Topaz',    color: '#F9A825', heroIcon: 'cake',             nibs: [1450, 1645, 1860, 2095] },
  { title: 'Sapphire', color: '#1565C0', heroIcon: 'lunch_dining',     nibs: [2355, 2640, 2955, 3300] },
  { title: 'Emerald',  color: '#2E7D32', heroIcon: 'restaurant',       nibs: [3680, 4100, 4560, 5070] },
  { title: 'Ruby',     color: '#C62828', heroIcon: 'emoji_events',     nibs: [5630, 6250, 6935, 7690] },
  { title: 'Diamond',  color: '#00BCD4', heroIcon: 'workspace_premium', nibs: [8525, 9445, 10460, 11580] },
  { title: 'Opal',     color: '#E91E63', heroIcon: 'military_tech',    nibs: [12820, 14190, 15710, 17400] },
];

export const LEVELS: LevelDefinition[] = STONES.flatMap((stone, stoneIdx) =>
  stone.nibs.map((nibsRequired, degreeIdx) => ({
    level: stoneIdx * 4 + degreeIdx + 1,
    nibsRequired,
    title: stone.title,
    degree: degreeIdx + 1,
    heroIcon: stone.heroIcon,
    color: stone.color,
  }))
);

// ─── Nib Rewards ──────────────────────────────────────────────────

export const NIBS = {
  guidedBake: 20,     // Active bake (guided flow)
  directBake: 3,      // Past bake log (direct flow)
  addPhoto: 1,        // Bonus for photo
  outcomeNotes: 5,    // Bonus for writing outcome notes
  earnBadge: 25,      // Per badge
} as const;

/** Get the nib floor for a stone — degree I of the stone the given level belongs to */
export function getStoneFloor(level: LevelDefinition): number {
  // degree I is the first level in the same stone group
  const stoneIndex = Math.floor((level.level - 1) / 4);
  return LEVELS[stoneIndex * 4].nibsRequired;
}

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
