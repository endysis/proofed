import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../common';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';
import type { MilestoneEvent } from '../../hooks/useMilestones';

interface Props {
  events: MilestoneEvent[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MilestoneFeed({ events }: Props) {
  if (events.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Recent Milestones</Text>
        <View style={styles.emptyCard}>
          <Icon name="emoji_events" size="lg" color={colors.dustyMauve} />
          <Text style={styles.emptyText}>Complete bakes to earn milestones!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recent Milestones</Text>
      <View style={styles.card}>
        {events.map((event, index) => (
          <React.Fragment key={event.id}>
            {index > 0 && <View style={styles.divider} />}
            <View style={styles.row}>
              <View style={styles.iconCircle}>
                <Icon name={event.icon} size="sm" color={colors.primary} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.eventText}>{event.text}</Text>
                <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
              </View>
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing[3],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[3],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  eventText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  eventDate: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginLeft: spacing[4] + 36 + spacing[3],
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    alignItems: 'center',
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    textAlign: 'center',
  },
});
