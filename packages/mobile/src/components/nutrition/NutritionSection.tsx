import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Icon } from '../common';
import ContainerSelectModal from './ContainerSelectModal';
import { useNutritionEstimate, ItemNutritionInput } from '../../hooks/useNutritionEstimate';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../../theme';
import type { ContainerInfo } from '@proofed/shared';
import type { ItemUsageDetail } from '../../hooks/useItemUsageDetails';

interface NutritionSectionProps {
  itemUsageDetails: ItemUsageDetail[];
  isLoading?: boolean;
  onNutritionCalculated?: (nutrition: { caloriesPerServing: number; sugarPerServing: number }) => void;
}

export default function NutritionSection({
  itemUsageDetails,
  isLoading: detailsLoading,
  onNutritionCalculated,
}: NutritionSectionProps) {
  const [showContainerModal, setShowContainerModal] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  // Convert itemUsageDetails to the format expected by useNutritionEstimate
  const nutritionInputs: ItemNutritionInput[] = useMemo(() => {
    return itemUsageDetails
      .filter((d) => !d.isStoreBought && d.ingredients.length > 0)
      .map((d) => ({
        ingredients: d.baseIngredients,
        scaleFactor: d.scaleFactor,
        containerInfo: d.containerInfo,
      }));
  }, [itemUsageDetails]);

  const {
    nutrition,
    isLoading,
    needsContainerInfo,
    error,
    calculateNutrition,
  } = useNutritionEstimate(nutritionInputs);

  // Auto-calculate if we have container info and haven't calculated yet
  useEffect(() => {
    if (!hasCalculated && !needsContainerInfo && nutritionInputs.length > 0 && !isLoading) {
      calculateNutrition();
      setHasCalculated(true);
    }
  }, [hasCalculated, needsContainerInfo, nutritionInputs.length, isLoading, calculateNutrition]);

  const handleContainerSelect = (container: ContainerInfo) => {
    setShowContainerModal(false);
    calculateNutrition(container);
    setHasCalculated(true);
  };

  // Report nutrition to parent when calculated
  useEffect(() => {
    if (nutrition && onNutritionCalculated) {
      onNutritionCalculated({
        caloriesPerServing: nutrition.caloriesPerServing,
        sugarPerServing: nutrition.sugarPerServing,
      });
    }
  }, [nutrition, onNutritionCalculated]);

  // Don't show section if no valid items with ingredients
  if (nutritionInputs.length === 0) {
    return null;
  }

  // Show skeleton while loading details
  if (detailsLoading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nutrition Estimate</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="small" />
          </View>
        </View>
      </View>
    );
  }

  // Show prompt to calculate if no nutrition yet
  if (!nutrition && !isLoading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nutrition Estimate</Text>
        </View>
        <TouchableOpacity
          style={styles.calculateCard}
          onPress={() => {
            if (needsContainerInfo) {
              setShowContainerModal(true);
            } else {
              calculateNutrition();
              setHasCalculated(true);
            }
          }}
        >
          <View style={styles.calculateIcon}>
            <Icon name="calculate" size="md" color={colors.primary} />
          </View>
          <View style={styles.calculateContent}>
            <Text style={styles.calculateTitle}>Calculate Nutrition</Text>
            <Text style={styles.calculateSubtitle}>
              {needsContainerInfo
                ? 'Select container to estimate servings'
                : 'Estimate calories and sugar per slice'}
            </Text>
          </View>
          <Icon name="chevron_right" size="sm" color={colors.dustyMauve} />
        </TouchableOpacity>

        <ContainerSelectModal
          isOpen={showContainerModal}
          onClose={() => setShowContainerModal(false)}
          onSelect={handleContainerSelect}
        />
      </View>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nutrition Estimate</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingText}>Calculating nutrition...</Text>
          </View>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nutrition Estimate</Text>
        </View>
        <View style={styles.errorCard}>
          <Icon name="error_outline" size="md" color={colors.error} />
          <Text style={styles.errorText}>Failed to calculate nutrition</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => calculateNutrition()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show nutrition results
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nutrition Estimate</Text>
      </View>
      <View style={styles.nutritionCard}>
        <View style={styles.nutritionRow}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionEmoji}>&#127856;</Text>
            <View>
              <Text style={styles.nutritionValue}>{nutrition!.caloriesPerServing}</Text>
              <Text style={styles.nutritionLabel}>calories</Text>
              <Text style={styles.nutritionUnit}>per slice</Text>
            </View>
          </View>
          <View style={styles.nutritionDivider} />
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionEmoji}>&#128202;</Text>
            <View>
              <Text style={styles.nutritionValue}>{nutrition!.sugarPerServing}g</Text>
              <Text style={styles.nutritionLabel}>sugar</Text>
              <Text style={styles.nutritionUnit}>per slice</Text>
            </View>
          </View>
        </View>
        <View style={styles.servingsRow}>
          <Text style={styles.servingsText}>
            Estimated from {nutrition!.totalServings} slices
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    padding: spacing[4],
  },
  calculateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    padding: spacing[4],
  },
  calculateIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  calculateContent: {
    flex: 1,
  },
  calculateTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
  },
  calculateSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    paddingVertical: spacing[4],
  },
  loadingText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    padding: spacing[4],
    gap: spacing[3],
  },
  errorText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.error,
  },
  retryButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
  },
  retryText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  nutritionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    padding: spacing[4],
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutritionItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  nutritionEmoji: {
    fontSize: 32,
  },
  nutritionValue: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: colors.text,
  },
  nutritionLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  nutritionUnit: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
  },
  nutritionDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: spacing[3],
  },
  servingsRow: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  servingsText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
});
