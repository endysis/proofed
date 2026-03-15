import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';

interface SummaryCardsProps {
  totalBakes: number;
  currentStreak: number;
}

export default function SummaryCards({
  totalBakes,
  currentStreak,
}: SummaryCardsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.value}>{totalBakes}</Text>
        <Text style={styles.label}>Completed Bakes</Text>
        <Text style={styles.sublabel}>All time</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.value}>{currentStreak}w</Text>
        <Text style={styles.label}>Current Streak</Text>
        <Text style={styles.sublabel}>Consecutive weeks</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  value: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    color: colors.primary,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.text,
    marginTop: spacing[1],
  },
  sublabel: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    color: colors.dustyMauve,
    marginTop: 2,
  },
});
