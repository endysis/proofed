import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from '../common';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../../theme';
import type { AiAdviceTip } from '@proofed/shared';

interface AiAdviceCardProps {
  tip: AiAdviceTip;
  onCreateVariant?: () => void;
}

export function AiAdviceCard({ tip, onCreateVariant }: AiAdviceCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{tip.title}</Text>
      <Text style={styles.suggestion}>{tip.suggestion}</Text>
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
});
