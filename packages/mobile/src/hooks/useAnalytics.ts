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
  recipeCount: number;
  color: string;
}

export interface AnalyticsData {
  totalBakes: number;
  currentStreak: number;
  monthlyActivity: MonthlyActivity[];
  categoryBreakdown: CategoryBreakdownItem[];
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

function getWeekKey(date: Date): string {
  // Use ISO week: Monday-based weeks identified by year + week number
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday (ISO week date algorithm)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function calculateStreak(attempts: Attempt[]): number {
  if (attempts.length === 0) return 0;

  const completedAttempts = attempts.filter((a) => a.status === 'done');
  if (completedAttempts.length === 0) return 0;

  // Get unique weeks with bakes, sorted descending
  const bakeWeeks = new Set(
    completedAttempts.map((a) => getWeekKey(new Date(a.date)))
  );
  const sortedWeeks = Array.from(bakeWeeks).sort().reverse();

  if (sortedWeeks.length === 0) return 0;

  const currentWeek = getWeekKey(new Date());
  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeek = getWeekKey(lastWeekDate);

  // Streak must include current or last week to be active
  if (sortedWeeks[0] !== currentWeek && sortedWeeks[0] !== lastWeek) {
    return 0;
  }

  // Count consecutive weeks going backwards
  let streak = 1;

  for (let i = 1; i < sortedWeeks.length; i++) {
    // Check if the previous week in sorted order is exactly the prior calendar week
    // Week keys are "YYYY-Wnn" and sort lexicographically correctly within a year
    // For cross-year boundaries, we compute the expected previous week
    const currentWk = sortedWeeks[i - 1];
    const year = parseInt(currentWk.split('-W')[0]);
    const week = parseInt(currentWk.split('-W')[1]);

    let expectedPrevWeek: string;
    if (week === 1) {
      // Previous week is the last week of the prior year
      // Find the last ISO week of the previous year
      const dec28 = new Date(Date.UTC(year - 1, 11, 28));
      const lastWeekKey = getWeekKey(dec28);
      expectedPrevWeek = lastWeekKey;
    } else {
      expectedPrevWeek = `${year}-W${String(week - 1).padStart(2, '0')}`;
    }

    if (sortedWeeks[i] === expectedPrevWeek) {
      streak++;
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
  const recipesByType = new Map<ItemType, Set<string>>();

  completedAttempts.forEach((attempt) => {
    attempt.itemUsages.forEach((usage) => {
      const item = itemMap.get(usage.itemId);
      if (item) {
        const type = item.type;
        countByType.set(type, (countByType.get(type) || 0) + 1);
        if (!recipesByType.has(type)) {
          recipesByType.set(type, new Set());
        }
        recipesByType.get(type)!.add(`${usage.itemId}:${usage.recipeId}`);
      }
    });
  });

  // Convert to array and sort by recipe count
  const breakdown: CategoryBreakdownItem[] = [];
  let colorIndex = 0;

  (Object.keys(categoryDisplayNames) as ItemType[]).forEach((type) => {
    const count = countByType.get(type) || 0;
    const recipeCount = recipesByType.get(type)?.size || 0;
    breakdown.push({
      type,
      label: categoryDisplayNames[type],
      count,
      recipeCount,
      color: chartColors[colorIndex % chartColors.length],
    });
    colorIndex++;
  });

  return breakdown.sort((a, b) => b.recipeCount - a.recipeCount);
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
        monthlyActivity: [],
        categoryBreakdown: [],
      };
    }

    const completedAttempts = attempts.filter((a) => a.status === 'done');

    return {
      totalBakes: completedAttempts.length,
      currentStreak: calculateStreak(attempts),
      monthlyActivity: getLast6MonthsActivity(attempts),
      categoryBreakdown: getCategoryBreakdown(attempts, items),
    };
  }, [attempts, items, isLoading]);

  return {
    ...analytics,
    isLoading,
  };
}
