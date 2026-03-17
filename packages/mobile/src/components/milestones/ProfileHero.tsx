import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../common';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';
import type { LevelDefinition } from '../../constants/milestones';

interface Props {
  currentLevel: LevelDefinition;
  totalNibs: number;
  nibsToNextLevel: number | null;
  levelProgress: number;
}

export default function ProfileHero({
  currentLevel,
  totalNibs,
  nibsToNextLevel,
  levelProgress,
}: Props) {
  return (
    <View style={styles.container}>
      {/* Level Icon Circle */}
      <View style={styles.iconCircle}>
        <Icon name={currentLevel.heroIcon} size="xl" color={colors.primary} />
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>LVL {currentLevel.level}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{currentLevel.title}</Text>

      {/* Nibs info */}
      <Text style={styles.nibsText}>
        {totalNibs} nibs
      </Text>

      {/* Progress to next level */}
      {nibsToNextLevel != null ? (
        <>
          <View style={styles.progressBarOuter}>
            <View
              style={[styles.progressBarInner, { width: `${Math.round(levelProgress * 100)}%` }]}
            />
          </View>
          <Text style={styles.nextLevelText}>
            {nibsToNextLevel} nibs to next rank
          </Text>
        </>
      ) : (
        <Text style={styles.nextLevelText}>Max level reached!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.white,
    marginHorizontal: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  levelBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: colors.white,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.text,
    marginBottom: spacing[1],
  },
  nibsText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    marginBottom: spacing[3],
  },
  progressBarOuter: {
    width: '80%',
    height: 8,
    backgroundColor: colors.bgLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing[2],
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  nextLevelText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
  },
});
