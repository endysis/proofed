import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Icon, Modal } from '../common';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';
import type { EarnedBadge } from '../../constants/milestones';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = spacing[3];
const HORIZONTAL_PAD = spacing[4];
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PAD * 2 - CARD_GAP * 2) / 3;

interface Props {
  earnedBadges: EarnedBadge[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function BadgeGrid({ earnedBadges }: Props) {
  const [selectedBadge, setSelectedBadge] = useState<EarnedBadge | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Acquired Badges</Text>
        <Text style={styles.countBadge}>{earnedBadges.length}</Text>
      </View>

      {earnedBadges.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="emoji_events" size="lg" color={colors.dustyMauve} />
          <Text style={styles.emptyText}>Complete bakes to earn your first badge!</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {earnedBadges.map((eb) => (
            <TouchableOpacity
              key={eb.badge.id}
              style={styles.badgeCard}
              activeOpacity={0.7}
              onPress={() => setSelectedBadge(eb)}
            >
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
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Modal
        isOpen={selectedBadge !== null}
        onClose={() => setSelectedBadge(null)}
        title={selectedBadge?.badge.name ?? ''}
      >
        {selectedBadge && (
          <View style={styles.modalContent}>
            <View style={styles.modalIconCircle}>
              <Icon name={selectedBadge.badge.icon} size="lg" color={colors.primary} />
            </View>
            <Text style={styles.modalDescription}>
              {selectedBadge.badge.description}
            </Text>
            <View style={styles.modalCategoryTag}>
              <Text style={styles.modalCategoryText}>
                {selectedBadge.badge.category.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.modalEarnedDate}>
              Earned {formatDate(selectedBadge.earnedAt)}
            </Text>
          </View>
        )}
      </Modal>
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    gap: spacing[3],
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    textAlign: 'center',
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
  badgeName: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.text,
    textAlign: 'center',
  },
  badgeDate: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    color: colors.dustyMauve,
    marginTop: 2,
  },
  modalContent: {
    alignItems: 'center',
    paddingBottom: spacing[4],
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  modalDescription: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing[4],
    lineHeight: 22,
  },
  modalCategoryTag: {
    backgroundColor: colors.bgLight,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    marginBottom: spacing[3],
  },
  modalCategoryText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    letterSpacing: 1,
  },
  modalEarnedDate: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
});
