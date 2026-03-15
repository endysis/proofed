import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';
import type { CategoryBreakdownItem } from '../../hooks/useAnalytics';

interface CategoryBreakdownProps {
  data: CategoryBreakdownItem[];
}

export default function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const totalRecipes = data.reduce((sum, item) => sum + item.recipeCount, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recipe Collection</Text>
      <Text style={styles.subtitle}>{totalRecipes} recipes discovered</Text>
      <View style={styles.grid}>
        {data.map((item) => {
          const discovered = item.recipeCount > 0;
          return (
            <View
              key={item.type}
              style={[styles.card, discovered ? styles.cardDiscovered : styles.cardUndiscovered]}
            >
              {discovered && (
                <View style={[styles.accentBar, { backgroundColor: item.color }]} />
              )}
              <View style={styles.cardContent}>
                <Text
                  style={[styles.cardLabel, !discovered && styles.cardLabelMuted]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
                {discovered ? (
                  <View style={styles.countRow}>
                    <Text style={styles.countValue}>{item.recipeCount}</Text>
                    <Text style={styles.countLabel}>
                      {item.recipeCount === 1 ? 'recipe' : 'recipes'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.undiscoveredLabel}>Undiscovered</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  card: {
    width: '48%',
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 64,
  },
  cardDiscovered: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardUndiscovered: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    opacity: 0.6,
  },
  accentBar: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: spacing[3],
    justifyContent: 'center',
  },
  cardLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.text,
    marginBottom: spacing[1],
  },
  cardLabelMuted: {
    color: colors.dustyMauve,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[1],
  },
  countValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.primary,
  },
  countLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
  },
  undiscoveredLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    fontStyle: 'italic',
  },
});
