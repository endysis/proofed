import { useMemo } from 'react';
import { useAttempts } from './useAttempts';
import { useItems } from './useItems';
import { useProofedItems } from './useProofedItems';
import { calculateStreak } from './useAnalytics';
import {
  BADGES,
  NIBS,
  getLevelForNibs,
  getNextLevel,
  getNibsToNextLevel,
  getLevelProgress,
  getStoneFloor,
  type BadgeDefinition,
  type BadgeContext,
  type BadgeProgress,
  type EarnedBadge,
  type LevelDefinition,
} from '../constants/milestones';
import type { Attempt } from '@proofed/shared';

export interface MilestoneEvent {
  id: string;
  type: 'badge' | 'level';
  icon: string;
  text: string;
  date: string;
}

export interface NextGoal {
  badge: BadgeDefinition;
  progress: BadgeProgress;
  motivationalText: string;
}

export interface MilestonesData {
  // Level info
  totalNibs: number;
  currentLevel: LevelDefinition;
  nextLevel: LevelDefinition | null;
  nibsToNextLevel: number | null;
  levelProgress: number; // 0-1

  // Badges
  earnedBadges: EarnedBadge[];
  lockedBadges: Array<{ badge: BadgeDefinition; progress: BadgeProgress }>;
  allBadges: BadgeDefinition[];

  // Next goal
  nextGoal: NextGoal | null;

  // Feed
  recentMilestones: MilestoneEvent[];

  isLoading: boolean;
}

function estimateEarnedDate(
  badge: BadgeDefinition,
  completedAttempts: Attempt[],
  proofedItemDates: string[]
): string {
  // Try to estimate when the badge was first earned based on attempt dates
  const sorted = [...completedAttempts].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  switch (badge.id) {
    case 'first-bake':
      return sorted[0]?.date || new Date().toISOString();
    case 'fifth-bake':
      return sorted[4]?.date || new Date().toISOString();
    case 'tenth-bake':
      return sorted[9]?.date || new Date().toISOString();
    case 'twenty-fifth-bake':
      return sorted[24]?.date || new Date().toISOString();
    case 'fiftieth-bake':
      return sorted[49]?.date || new Date().toISOString();
    case 'hundredth-bake':
      return sorted[99]?.date || new Date().toISOString();
    case 'crumb-favourite': {
      const first = sorted.find((a) => a.aiAdvice?.nibsAwarded && a.aiAdvice.nibsAwarded >= 40);
      return first?.date || new Date().toISOString();
    }
    case 'consistently-brilliant': {
      const highNibBakes = sorted.filter((a) => a.aiAdvice?.nibsAwarded && a.aiAdvice.nibsAwarded >= 40);
      return highNibBakes[4]?.date || new Date().toISOString();
    }
    case 'first-photo': {
      const first = sorted.find((a) => a.photoKeys && a.photoKeys.length > 0);
      return first?.date || new Date().toISOString();
    }
    case 'first-proofed':
      return proofedItemDates[0] || new Date().toISOString();
    default:
      // For streak/variety badges, use the latest attempt date as approximation
      return sorted[sorted.length - 1]?.date || new Date().toISOString();
  }
}

function calculateTotalNibs(
  completedAttempts: Attempt[],
  earnedBadgeCount: number,
): number {
  let nibs = 0;

  completedAttempts.forEach((a) => {
    // Tiered bake reward based on flow type
    nibs += a.flowType === 'guided' ? NIBS.guidedBake : NIBS.directBake;
    if (a.photoKeys && a.photoKeys.length > 0) nibs += NIBS.addPhoto;
    if (a.outcomeNotes && a.outcomeNotes.trim().length > 0) nibs += NIBS.outcomeNotes;
    nibs += a.aiAdvice?.nibsAwarded || 0;
  });

  nibs += earnedBadgeCount * NIBS.earnBadge;

  // Nib decay for inactivity (180+ days since last bake)
  if (completedAttempts.length > 0) {
    const mostRecentDate = completedAttempts.reduce((latest, a) => {
      const d = new Date(a.date).getTime();
      return d > latest ? d : latest;
    }, 0);
    const daysSinceLastBake = Math.floor((Date.now() - mostRecentDate) / (1000 * 60 * 60 * 24));

    if (daysSinceLastBake > 180) {
      const decayMonths = Math.floor((daysSinceLastBake - 180) / 30);
      const decay = decayMonths * 20;
      const preDecayLevel = getLevelForNibs(nibs);
      const floor = getStoneFloor(preDecayLevel);
      nibs = Math.max(nibs - decay, floor);
    }
  }

  return nibs;
}

export function useMilestones(): MilestonesData {
  const { data: attempts = [], isLoading: attemptsLoading } = useAttempts();
  const { data: items = [], isLoading: itemsLoading } = useItems();
  const { data: proofedItems = [], isLoading: proofedLoading } = useProofedItems();

  const isLoading = attemptsLoading || itemsLoading || proofedLoading;

  const milestones = useMemo(() => {
    if (isLoading) {
      return {
        totalNibs: 0,
        currentLevel: { level: 1, nibsRequired: 0, title: 'Quartz', degree: 1, heroIcon: 'cookie', color: '#9E9E9E' } as LevelDefinition,
        nextLevel: null,
        nibsToNextLevel: null,
        levelProgress: 0,
        earnedBadges: [],
        lockedBadges: BADGES.map((badge) => ({ badge, progress: { earned: false, current: 0, target: 1 } })),
        allBadges: BADGES,
        nextGoal: null,
        recentMilestones: [],
      };
    }

    const completedAttempts = attempts.filter((a) => a.status === 'done');
    const currentStreak = calculateStreak(attempts);

    const ctx: BadgeContext = {
      completedAttempts,
      allAttempts: attempts,
      items,
      proofedItems,
      currentStreak,
    };

    // Evaluate all badges
    const earnedBadges: EarnedBadge[] = [];
    const lockedBadges: Array<{ badge: BadgeDefinition; progress: BadgeProgress }> = [];
    const proofedDates = [...proofedItems]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((p) => p.createdAt);

    BADGES.forEach((badge) => {
      const progress = badge.check(ctx);
      if (progress.earned) {
        earnedBadges.push({
          badge,
          earnedAt: estimateEarnedDate(badge, completedAttempts, proofedDates),
          isNew: false, // Will be set by the screen using seenBadgeIds
        });
      } else {
        lockedBadges.push({ badge, progress });
      }
    });

    // Calculate nibs
    const totalNibs = calculateTotalNibs(completedAttempts, earnedBadges.length);
    const currentLevel = getLevelForNibs(totalNibs);
    const nextLevel = getNextLevel(totalNibs);
    const nibsToNextLevel = getNibsToNextLevel(totalNibs);
    const levelProgress = getLevelProgress(totalNibs);

    // Find next goal — closest locked badge to completion
    let nextGoal: NextGoal | null = null;
    if (lockedBadges.length > 0) {
      const sorted = [...lockedBadges].sort((a, b) => {
        const aRatio = a.progress.target > 0 ? a.progress.current / a.progress.target : 0;
        const bRatio = b.progress.target > 0 ? b.progress.current / b.progress.target : 0;
        return bRatio - aRatio; // Highest progress ratio first
      });
      const goal = sorted[0];
      const remaining = goal.progress.target - goal.progress.current;
      nextGoal = {
        badge: goal.badge,
        progress: goal.progress,
        motivationalText: `${remaining} more ${remaining === 1 ? 'to go' : 'to go'} to unlock ${goal.badge.name}!`,
      };
    }

    // Build recent milestones feed (badge earns, sorted by date)
    const recentMilestones: MilestoneEvent[] = earnedBadges
      .map((eb) => ({
        id: `badge-${eb.badge.id}`,
        type: 'badge' as const,
        icon: eb.badge.icon,
        text: `Earned "${eb.badge.name}" badge`,
        date: eb.earnedAt,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return {
      totalNibs,
      currentLevel,
      nextLevel,
      nibsToNextLevel,
      levelProgress,
      earnedBadges,
      lockedBadges,
      allBadges: BADGES,
      nextGoal,
      recentMilestones,
    };
  }, [attempts, items, proofedItems, isLoading]);

  return {
    ...milestones,
    isLoading,
  };
}
