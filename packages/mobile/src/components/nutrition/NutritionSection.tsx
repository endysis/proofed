import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Keyboard,
} from 'react-native';
import { Icon } from '../common';
import { useNutritionEstimate, ItemNutritionInput } from '../../hooks/useNutritionEstimate';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../../theme';
import type { NutritionInfo } from '@proofed/shared';
import type { ItemUsageDetail } from '../../hooks/useItemUsageDetails';

interface NutritionSectionProps {
  itemUsageDetails: ItemUsageDetail[];
  isLoading?: boolean;
  savedNutrition?: NutritionInfo;
  onSaveNutrition?: (nutrition: NutritionInfo) => void;
}

export default function NutritionSection({
  itemUsageDetails,
  isLoading: detailsLoading,
  savedNutrition,
  onSaveNutrition,
}: NutritionSectionProps) {
  const [sliceCount, setSliceCount] = useState('12');
  const [showInput, setShowInput] = useState(false);
  const [localNutrition, setLocalNutrition] = useState<NutritionInfo | null>(null);

  // Convert itemUsageDetails to the format expected by useNutritionEstimate
  // Now includes both homemade items (with ingredients) and store-bought items (with nutrition data)
  const nutritionInputs: ItemNutritionInput[] = useMemo(() => {
    return itemUsageDetails
      .filter((d) => {
        // Include homemade items with ingredients
        if (!d.isStoreBought && d.ingredients.length > 0) return true;
        // Include store-bought items with usage quantity and nutrition data
        if (d.isStoreBought && d.usageQuantity && d.usageQuantity > 0 &&
            (d.energyKcal100g != null || d.sugars100g != null)) return true;
        return false;
      })
      .map((d) => ({
        ingredients: d.baseIngredients,
        scaleFactor: d.scaleFactor,
        // Store-bought fields
        isStoreBought: d.isStoreBought,
        usageQuantity: d.usageQuantity,
        usageUnit: d.usageUnit,
        energyKcal100g: d.energyKcal100g,
        sugars100g: d.sugars100g,
      }));
  }, [itemUsageDetails]);

  const { totalCalories, totalSugar, calculateNutrition } =
    useNutritionEstimate(nutritionInputs);

  // Use saved nutrition if available, otherwise use local
  const nutrition = savedNutrition || localNutrition;

  // Initialize slice count from saved nutrition
  useEffect(() => {
    if (savedNutrition) {
      setSliceCount(savedNutrition.totalServings.toString());
    }
  }, [savedNutrition]);

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
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </View>
    );
  }

  const handleCalculate = () => {
    const count = parseInt(sliceCount, 10) || 12;
    setSliceCount(count.toString());

    const newNutrition: NutritionInfo = {
      totalCalories,
      totalSugar,
      totalServings: count,
      caloriesPerServing: Math.round(totalCalories / count),
      sugarPerServing: Math.round((totalSugar / count) * 10) / 10,
    };

    setLocalNutrition(newNutrition);
    setShowInput(false);
    Keyboard.dismiss();

    // Save to attempt
    if (onSaveNutrition) {
      onSaveNutrition(newNutrition);
    }
  };

  const handleRecalculate = () => {
    setShowInput(true);
  };

  const handleSliceCountChange = (text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    setSliceCount(numericText);
  };

  // Show input for slice count (only if no saved nutrition and not yet calculated)
  if (!nutrition || showInput) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nutrition Estimate</Text>
        </View>
        <View style={styles.inputCard}>
          <View style={styles.totalCaloriesRow}>
            <Icon name="local_fire_department" size="md" color={colors.primary} />
            <Text style={styles.totalCaloriesText}>
              Total: {totalCalories.toLocaleString()} calories
            </Text>
          </View>

          <View style={styles.sliceInputSection}>
            <Text style={styles.sliceInputLabel}>
              How many slices will you cut?
            </Text>
            <View style={styles.sliceInputRow}>
              <TouchableOpacity
                style={styles.sliceButton}
                onPress={() => {
                  const current = parseInt(sliceCount, 10) || 12;
                  if (current > 1) setSliceCount((current - 1).toString());
                }}
              >
                <Icon name="remove" size="md" color={colors.primary} />
              </TouchableOpacity>
              <TextInput
                style={styles.sliceInput}
                value={sliceCount}
                onChangeText={handleSliceCountChange}
                keyboardType="number-pad"
                selectTextOnFocus
                maxLength={3}
              />
              <TouchableOpacity
                style={styles.sliceButton}
                onPress={() => {
                  const current = parseInt(sliceCount, 10) || 12;
                  setSliceCount((current + 1).toString());
                }}
              >
                <Icon name="add" size="md" color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
            <Icon name="calculate" size="sm" color={colors.white} />
            <Text style={styles.calculateButtonText}>Calculate Per Slice</Text>
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
        <TouchableOpacity onPress={handleRecalculate}>
          <Text style={styles.editLink}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.nutritionCard}>
        <View style={styles.nutritionRow}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionEmoji}>🍰</Text>
            <View>
              <Text style={styles.nutritionValue}>
                {nutrition.caloriesPerServing}
              </Text>
              <Text style={styles.nutritionLabel}>calories</Text>
              <Text style={styles.nutritionUnit}>per slice</Text>
            </View>
          </View>
          <View style={styles.nutritionDivider} />
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionEmoji}>📊</Text>
            <View>
              <Text style={styles.nutritionValue}>{nutrition.sugarPerServing}g</Text>
              <Text style={styles.nutritionLabel}>sugar</Text>
              <Text style={styles.nutritionUnit}>per slice</Text>
            </View>
          </View>
        </View>
        <View style={styles.servingsRow}>
          <Text style={styles.servingsText}>
            Based on {nutrition.totalServings} slices • {nutrition.totalCalories.toLocaleString()} cal total
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
  editLink: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    padding: spacing[4],
  },
  inputCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    padding: spacing[4],
  },
  totalCaloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  totalCaloriesText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
  },
  sliceInputSection: {
    marginBottom: spacing[4],
  },
  sliceInputLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  sliceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  sliceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliceInput: {
    width: 80,
    height: 56,
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.xl,
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[3],
  },
  calculateButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.white,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
  },
  loadingText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
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
