import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from '../common';
import { AiAdviceCard } from './AiAdviceCard';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../../theme';
import type { AiAdviceResponse, AiAdviceTip } from '@proofed/shared';

interface ItemUsageDetail {
  itemName: string;
  recipeName: string;
  variantName?: string;
}

interface AiAdviceSectionProps {
  advice: AiAdviceResponse | null;
  isLoading: boolean;
  error: Error | null;
  onRequestAdvice: () => void;
  onCreateVariantFromTip?: (tip: AiAdviceTip) => void;
  canRequest: boolean;
  hasPhoto?: boolean;
  itemUsageDetails?: ItemUsageDetail[];
}

export function AiAdviceSection({
  advice,
  isLoading,
  error,
  onRequestAdvice,
  onCreateVariantFromTip,
  canRequest,
  hasPhoto,
  itemUsageDetails,
}: AiAdviceSectionProps) {
  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Crumb is thinking...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorCard}>
          <Icon name="error" size="md" color={colors.primary} />
          <Text style={styles.errorText}>Failed to get advice</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRequestAdvice}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Advice received state
  if (advice && advice.tips.length > 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="auto_awesome" size="md" color={colors.primary} />
            <Text style={styles.headerTitle}>Crumb</Text>
          </View>
        </View>

        {/* Overview - friendly reaction */}
        {advice.overview && (
          <View style={styles.overviewCard}>
            <Text style={styles.overviewText}>{advice.overview}</Text>
          </View>
        )}

        {/* Tips section header */}
        <Text style={styles.tipsHeader}>Suggestions</Text>

        {advice.tips.map((tip, index) => {
          const targetItemName =
            typeof tip.itemUsageIndex === 'number' && itemUsageDetails?.[tip.itemUsageIndex]
              ? itemUsageDetails[tip.itemUsageIndex].itemName
              : undefined;
          return (
            <AiAdviceCard
              key={index}
              tip={tip}
              targetItemName={targetItemName}
              onCreateVariant={onCreateVariantFromTip ? () => onCreateVariantFromTip(tip) : undefined}
            />
          );
        })}

        <TouchableOpacity style={styles.reaskButton} onPress={onRequestAdvice}>
          <Icon name="refresh" size="sm" color={colors.primary} />
          <Text style={styles.reaskButtonText}>Ask Crumb again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleRequestAdvice = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRequestAdvice();
  };

  // Default state - show request button
  return (
    <View style={styles.container}>
      <View style={styles.requestButtonWrapper}>
        <TouchableOpacity
          style={[styles.requestButton, !canRequest && styles.requestButtonDisabled]}
          onPress={handleRequestAdvice}
          disabled={!canRequest}
        >
          <Icon name="auto_awesome" size="sm" color={canRequest ? colors.white : colors.dustyMauve} />
          <Text style={[styles.requestButtonText, !canRequest && styles.requestButtonTextDisabled]}>
            Ask Crumb
          </Text>
        </TouchableOpacity>
        {!canRequest && (
          <Text style={styles.requestButtonHint}>Add outcome notes first</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  overviewCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(229, 52, 78, 0.15)',
  },
  overviewText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 22,
  },
  tipsHeader: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[2],
  },
  requestButtonWrapper: {
    alignItems: 'center',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    gap: spacing[2],
  },
  requestButtonDisabled: {
    backgroundColor: colors.dustyMauve,
  },
  requestButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.white,
  },
  requestButtonTextDisabled: {
    color: colors.white,
  },
  requestButtonHint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    marginTop: spacing[2],
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    gap: spacing[3],
  },
  loadingText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  errorCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    gap: spacing[2],
  },
  errorText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  retryButton: {
    marginTop: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.white,
  },
  reaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: borderRadius.full,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    marginTop: spacing[3],
    gap: spacing[2],
  },
  reaskButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
});
