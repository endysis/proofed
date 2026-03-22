import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '../common';
import { NIBS, type EarnedBadge } from '../../constants/milestones';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../../theme';
import type { Attempt } from '@proofed/shared';

interface NibsSummaryProps {
  attempt: Attempt;
  newBadges: EarnedBadge[];
  onViewMilestones: () => void;
}

export default function NibsSummary({ attempt, newBadges, onViewMilestones }: NibsSummaryProps) {
  const bakeNibs = attempt.flowType === 'guided' ? NIBS.guidedBake : NIBS.directBake;
  const photoNibs = attempt.photoKeys && attempt.photoKeys.length > 0 ? NIBS.addPhoto : 0;
  const notesNibs = attempt.outcomeNotes?.trim() ? NIBS.outcomeNotes : 0;
  const crumbNibs = attempt.aiAdvice?.nibsAwarded || 0;
  const total = bakeNibs + photoNibs + notesNibs + crumbNibs;

  const rows: Array<{ label: string; nibs: number }> = [
    { label: 'Bake completed', nibs: bakeNibs },
  ];
  if (photoNibs > 0) rows.push({ label: 'Added photo', nibs: photoNibs });
  if (notesNibs > 0) rows.push({ label: 'Outcome notes', nibs: notesNibs });
  if (crumbNibs > 0) rows.push({ label: 'Crumb award', nibs: crumbNibs });

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Nibs Earned</Text>

      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.rowLabel}>{row.label}</Text>
          <Text style={styles.rowValue}>+{row.nibs}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>+{total}</Text>
      </View>

      {newBadges.length > 0 && (
        <View style={styles.badgeSection}>
          {newBadges.map((eb) => (
            <View key={eb.badge.id} style={styles.badgeRow}>
              <Icon name="emoji_events" size="sm" color="#F59E0B" />
              <Text style={styles.badgeText}>
                New badge: {eb.badge.name}!
              </Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.viewButton} onPress={onViewMilestones}>
        <Text style={styles.viewButtonText}>View Progress</Text>
        <Icon name="arrow_forward" size="sm" color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
    marginBottom: spacing[3],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[1],
  },
  rowLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  rowValue: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginVertical: spacing[2],
  },
  totalLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  totalValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.primary,
  },
  badgeSection: {
    marginTop: spacing[3],
    gap: spacing[2],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: spacing[2],
    borderRadius: borderRadius.default,
  },
  badgeText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: '#92400E',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    marginTop: spacing[3],
    paddingVertical: spacing[2],
  },
  viewButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
});
