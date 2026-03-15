import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';
import type { MonthlyActivity } from '../../hooks/useAnalytics';

interface BakeActivityChartProps {
  data: MonthlyActivity[];
}

export default function BakeActivityChart({ data }: BakeActivityChartProps) {
  const totalBakesInPeriod = data.reduce((sum, d) => sum + d.value, 0);
  const activeMonths = data.filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Monthly Baking Activity</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No baking activity yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monthly Baking Activity</Text>
      <Text style={styles.subtitle}>
        {totalBakesInPeriod} bake{totalBakesInPeriod !== 1 ? 's' : ''} across{' '}
        {activeMonths.length} month{activeMonths.length !== 1 ? 's' : ''} in the
        last 6 months
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardRow}
      >
        {activeMonths.map((item) => (
          <View key={item.month} style={styles.card}>
            <Text style={styles.monthLabel}>{item.label}</Text>
            <Text style={styles.count}>{item.value}</Text>
            <Text style={styles.bakesLabel}>bakes</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    marginTop: spacing[1],
    marginBottom: spacing[3],
  },
  cardRow: {
    gap: spacing[3],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  monthLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.text,
    marginBottom: spacing[1],
  },
  count: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    color: colors.primary,
  },
  bakesLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    color: colors.dustyMauve,
    marginTop: 2,
  },
  emptyState: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
});
