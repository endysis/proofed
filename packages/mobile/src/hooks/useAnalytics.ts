import { useMemo } from 'react';
import { useAttempts } from './useAttempts';
import { useItems } from './useItems';
import type { Attempt, Item, ItemType } from '@proofed/shared';

export interface MonthlyActivity {
  month: string; // "YYYY-MM" format
  label: string; // "Jan", "Feb", etc.
  value: number;
}

export interface CategoryBreakdownItem {
  type: ItemType;
  label: string;
  count: number;
  color: string;
}

export interface TopRecipeItem {
  itemId: string;
  itemName: string;
  recipeId: string;
  recipeName: string;
  bakeCount: number;
  averageRating: number | null;
  photoKey?: string;
}

export interface AnalyticsData {
  totalBakes: number;
  currentStreak: number;
  averageRating: number | null;
  monthlyActivity: MonthlyActivity[];
  categoryBreakdown: CategoryBreakdownItem[];
  topRecipes: TopRecipeItem[];
  isLoading: boolean;
}

const categoryDisplayNames: Record<ItemType, string> = {
  dough: 'Bread & Doughs',
  batter: 'Cakes & Batters',
  frosting: 'Frostings',
  filling: 'Fillings',
  glaze: 'Glazes',
  other: 'Other',
};

const chartColors = ['#e5344e', '#f4acb7', '#9d8189', '#ffccd5', '#fbb1bd', '#c9ada7'];

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function calculateStreak(attempts: Attempt[]): number {
  if (attempts.length === 0) return 0;

  // Only count completed bakes
  const completedAttempts = attempts.filter((a) => a.status === 'done');
  if (completedAttempts.length === 0) return 0;

  // Get unique dates with bakes, sorted descending
  const bakeDates = new Set(
    completedAttempts.map((a) => getDateString(new Date(a.date)))
  );
  const sortedDates = Array.from(bakeDates).sort().reverse();

  if (sortedDates.length === 0) return 0;

  const today = getDateString(new Date());
  const yesterday = getDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));

  // Streak must include today or yesterday to be active
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  let currentDate = new Date(sortedDates[0]);

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    const prevDateStr = getDateString(prevDate);

    if (sortedDates[i] === prevDateStr) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }

  return streak;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getLast6MonthsActivity(attempts: Attempt[]): MonthlyActivity[] {
  const completedAttempts = attempts.filter((a) => a.status === 'done');
  const today = new Date();
  const result: MonthlyActivity[] = [];

  // Count bakes per month
  const countByMonth = new Map<string, number>();
  completedAttempts.forEach((attempt) => {
    const monthKey = getMonthKey(new Date(attempt.date));
    countByMonth.set(monthKey, (countByMonth.get(monthKey) || 0) + 1);
  });

  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = getMonthKey(date);
    result.push({
      month: monthKey,
      label: monthNames[date.getMonth()],
      value: countByMonth.get(monthKey) || 0,
    });
  }

  return result;
}

function getCategoryBreakdown(
  attempts: Attempt[],
  items: Item[]
): CategoryBreakdownItem[] {
  const completedAttempts = attempts.filter((a) => a.status === 'done');
  const itemMap = new Map(items.map((item) => [item.itemId, item]));
  const countByType = new Map<ItemType, number>();

  completedAttempts.forEach((attempt) => {
    attempt.itemUsages.forEach((usage) => {
      const item = itemMap.get(usage.itemId);
      if (item) {
        const type = item.type;
        countByType.set(type, (countByType.get(type) || 0) + 1);
      }
    });
  });

  // Convert to array and sort by count
  const breakdown: CategoryBreakdownItem[] = [];
  let colorIndex = 0;

  (Object.keys(categoryDisplayNames) as ItemType[]).forEach((type) => {
    const count = countByType.get(type) || 0;
    if (count > 0) {
      breakdown.push({
        type,
        label: categoryDisplayNames[type],
        count,
        color: chartColors[colorIndex % chartColors.length],
      });
      colorIndex++;
    }
  });

  return breakdown.sort((a, b) => b.count - a.count);
}

function getTopRecipes(
  attempts: Attempt[],
  items: Item[]
): TopRecipeItem[] {
  const completedAttempts = attempts.filter((a) => a.status === 'done');
  const itemMap = new Map(items.map((item) => [item.itemId, item]));

  // Group by itemId + recipeId
  const recipeStats = new Map<
    string,
    {
      itemId: string;
      recipeId: string;
      bakeCount: number;
      ratings: number[];
      photoKey?: string;
    }
  >();

  completedAttempts.forEach((attempt) => {
    attempt.itemUsages.forEach((usage) => {
      const key = `${usage.itemId}:${usage.recipeId}`;
      const existing = recipeStats.get(key);

      if (existing) {
        existing.bakeCount++;
        if (attempt.rating) {
          existing.ratings.push(attempt.rating);
        }
        if (!existing.photoKey && attempt.mainPhotoKey) {
          existing.photoKey = attempt.mainPhotoKey;
        }
      } else {
        recipeStats.set(key, {
          itemId: usage.itemId,
          recipeId: usage.recipeId,
          bakeCount: 1,
          ratings: attempt.rating ? [attempt.rating] : [],
          photoKey: attempt.mainPhotoKey,
        });
      }
    });
  });

  // Convert to array and sort by bake count
  const topRecipes: TopRecipeItem[] = [];

  recipeStats.forEach((stats) => {
    const item = itemMap.get(stats.itemId);
    if (item) {
      const avgRating =
        stats.ratings.length > 0
          ? stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length
          : null;

      topRecipes.push({
        itemId: stats.itemId,
        itemName: item.name,
        recipeId: stats.recipeId,
        recipeName: '', // Will be filled by component
        bakeCount: stats.bakeCount,
        averageRating: avgRating,
        photoKey: stats.photoKey,
      });
    }
  });

  return topRecipes.sort((a, b) => b.bakeCount - a.bakeCount).slice(0, 5);
}

export function useAnalytics(): AnalyticsData {
  const { data: attempts = [], isLoading: attemptsLoading } = useAttempts();
  const { data: items = [], isLoading: itemsLoading } = useItems();

  const isLoading = attemptsLoading || itemsLoading;

  const analytics = useMemo(() => {
    if (isLoading) {
      return {
        totalBakes: 0,
        currentStreak: 0,
        averageRating: null,
        monthlyActivity: [],
        categoryBreakdown: [],
        topRecipes: [],
      };
    }

    const completedAttempts = attempts.filter((a) => a.status === 'done');
    const ratingsArray = completedAttempts
      .filter((a) => a.rating)
      .map((a) => a.rating as number);
    const avgRating =
      ratingsArray.length > 0
        ? ratingsArray.reduce((a, b) => a + b, 0) / ratingsArray.length
        : null;

    return {
      totalBakes: completedAttempts.length,
      currentStreak: calculateStreak(attempts),
      averageRating: avgRating,
      monthlyActivity: getLast6MonthsActivity(attempts),
      categoryBreakdown: getCategoryBreakdown(attempts, items),
      topRecipes: getTopRecipes(attempts, items),
    };
  }, [attempts, items, isLoading]);

  return {
    ...analytics,
    isLoading,
  };
}
