import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Icon } from '../common';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';
import type { BadgeDefinition, BadgeProgress, EarnedBadge } from '../../constants/milestones';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = spacing[3];
const HORIZONTAL_PAD = spacing[4];
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PAD * 2 - CARD_GAP * 2) / 3;

interface Props {
  earnedBadges: EarnedBadge[];
  lockedBadges: Array<{ badge: BadgeDefinition; progress: BadgeProgress }>;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function BadgeGrid({ earnedBadges, lockedBadges }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Your Badges</Text>
        <Text style={styles.countBadge}>{earnedBadges.length} UNLOCKED</Text>
      </View>

      <View style={styles.grid}>
        {earnedBadges.map((eb) => (
          <View key={eb.badge.id} style={styles.badgeCard}>
            {eb.isNew && (
              <View style={styles.newIndicator}>
                <Text style={styles.newText}>NEW</Text>
              </View>
            )}
            <View style={styles.earnedIconCircle}>
              <Icon name={eb.badge.icon} size="md" color={colors.primary} />
            </View>
            <Text style={styles.badgeName} numberOfLines={1}>
              {eb.badge.name}
            </Text>
            <Text style={styles.badgeDate}>{formatDate(eb.earnedAt)}</Text>
          </View>
        ))}

        {lockedBadges.map(({ badge, progress }) => (
          <View key={badge.id} style={styles.badgeCard}>
            <View style={styles.lockedIconCircle}>
              <Icon name={badge.icon} size="md" color={colors.dustyMauve} />
            </View>
            <Text style={[styles.badgeName, styles.lockedText]} numberOfLines={1}>
              {badge.name}
            </Text>
            <Text style={styles.badgeProgress}>
              {progress.current}/{progress.target}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: HORIZONTAL_PAD,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  countBadge: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.primary,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  badgeCard: {
    width: CARD_WIDTH,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  newIndicator: {
    position: 'absolute',
    top: spacing[1],
    right: spacing[1],
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[1],
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  newText: {
    fontFamily: fontFamily.bold,
    fontSize: 8,
    color: colors.white,
    letterSpacing: 0.5,
  },
  earnedIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  lockedIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
    opacity: 0.5,
  },
  badgeName: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.text,
    textAlign: 'center',
  },
  lockedText: {
    color: colors.dustyMauve,
  },
  badgeDate: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    color: colors.dustyMauve,
    marginTop: 2,
  },
  badgeProgress: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    color: colors.dustyMauve,
    marginTop: 2,
  },
});
