import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from '../common';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../../theme';
import type { AiAdviceTip } from '@proofed/shared';

interface AiAdviceCardProps {
  tip: AiAdviceTip;
  targetItemName?: string;
  scaleFactor?: number;
  onCreateVariant?: () => void;
}

export function AiAdviceCard({ tip, targetItemName, scaleFactor = 1, onCreateVariant }: AiAdviceCardProps) {
  // Format ingredient overrides with scaled quantities
  const formattedOverrides = tip.ingredientOverrides?.map(ing => {
    const scaledQty = Math.round(ing.quantity * scaleFactor * 100) / 100;
    return `${ing.name}: ${scaledQty} ${ing.unit}`;
  }).join(', ');

  return (
    <View style={styles.card}>
      {targetItemName && (
        <View style={styles.targetBadge}>
          <Icon name="cake" size="sm" color={colors.primary} />
          <Text style={styles.targetText}>For: {targetItemName}</Text>
        </View>
      )}
      <Text style={styles.title}>{tip.title}</Text>
      <Text style={styles.suggestion}>{tip.suggestion}</Text>
      {formattedOverrides && (
        <View style={styles.ingredientChanges}>
          <Text style={styles.ingredientChangesLabel}>Suggested changes:</Text>
          <Text style={styles.ingredientChangesText}>{formattedOverrides}</Text>
        </View>
      )}
      {onCreateVariant && (
        <TouchableOpacity style={styles.createVariantButton} onPress={onCreateVariant}>
          <Icon name="add" size="sm" color={colors.primary} />
          <Text style={styles.createVariantText}>Create Variant</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    padding: spacing[4],
    marginBottom: spacing[2],
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  targetText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.primary,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing[1],
  },
  suggestion: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  createVariantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing[1],
    marginTop: spacing[3],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
  },
  createVariantText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.primary,
  },
  ingredientChanges: {
    marginTop: spacing[2],
    padding: spacing[2],
    backgroundColor: 'rgba(229, 52, 78, 0.05)',
    borderRadius: borderRadius.lg,
  },
  ingredientChangesLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    marginBottom: spacing[1],
  },
  ingredientChangesText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
});
