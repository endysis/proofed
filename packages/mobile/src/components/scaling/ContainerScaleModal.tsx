import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Modal, Icon } from '../common';
import { useAiContainerScale } from '../../hooks/useAiContainerScale';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../../theme';
import type {
  ContainerInfo,
  ContainerType,
  MuffinCupSize,
  ItemType,
  Ingredient,
  AiContainerScaleResponse,
} from '@proofed/shared';

const CONTAINER_TYPES: { value: ContainerType; label: string }[] = [
  { value: 'round_cake_tin', label: 'Round Cake Tin' },
  { value: 'square_cake_tin', label: 'Square Cake Tin' },
  { value: 'loaf_tin', label: 'Loaf Tin' },
  { value: 'bundt_tin', label: 'Bundt Tin' },
  { value: 'sheet_pan', label: 'Sheet Pan' },
  { value: 'muffin_tin', label: 'Muffin Tin' },
];

// Type-specific size options
const ROUND_SIZES: number[] = [6, 7, 8, 9, 10, 12];
const SQUARE_SIZES: number[] = [8, 9, 10];
const LOAF_SIZES: { length: number; width: number; label: string }[] = [
  { length: 8, width: 4, label: '8" × 4"' },
  { length: 8.5, width: 4.5, label: '8.5" × 4.5"' },
  { length: 9, width: 5, label: '9" × 5"' },
];
const BUNDT_CAPACITIES: { capacity: number; label: string }[] = [
  { capacity: 6, label: '6-cup' },
  { capacity: 9, label: '9-cup' },
  { capacity: 10, label: '10-cup' },
  { capacity: 12, label: '12-cup' },
  { capacity: 15, label: '15-cup' },
];
const SHEET_SIZES: { length: number; width: number; label: string }[] = [
  { length: 9, width: 13, label: '9" × 13" (Quarter)' },
  { length: 11, width: 7, label: '11" × 7"' },
  { length: 13, width: 18, label: '13" × 18" (Half)' },
];
const MUFFIN_CUP_SIZES: { value: MuffinCupSize; label: string }[] = [
  { value: 'mini', label: 'Mini' },
  { value: 'standard', label: 'Standard' },
  { value: 'jumbo', label: 'Jumbo' },
];
const MUFFIN_CUPS_PER_TRAY: number[] = [4, 6, 12, 24];
const CONTAINER_COUNTS: number[] = [1, 2, 3, 4, 6, 12, 24];
const TRAY_COUNTS: number[] = [1, 2, 3, 4];

interface ContainerScaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (scaleFactor: number) => void;
  sourceContainer: ContainerInfo;
  recipeId: string;
  context: {
    itemName: string;
    itemType: ItemType;
    recipeName: string;
    ingredients: Ingredient[];
    bakeTime?: number;
    bakeTemp?: number;
    bakeTempUnit?: 'F' | 'C';
  };
}

function formatContainer(container: ContainerInfo): string {
  const typeLabel = CONTAINER_TYPES.find((t) => t.value === container.type)?.label || 'Container';
  const plural = container.count > 1 ? 's' : '';

  switch (container.type) {
    case 'round_cake_tin':
    case 'square_cake_tin':
      return `${container.count} × ${container.size}" ${typeLabel}${plural}`;

    case 'loaf_tin':
    case 'sheet_pan':
      return `${container.count} × ${container.length}"×${container.width}" ${typeLabel}${plural}`;

    case 'bundt_tin':
      return `${container.count} × ${container.capacity}-cup ${typeLabel}${plural}`;

    case 'muffin_tin':
      const cupLabel = MUFFIN_CUP_SIZES.find((s) => s.value === container.cupSize)?.label || 'Standard';
      const totalCups = (container.cupsPerTray || 12) * container.count;
      const trayText = container.count > 1 ? `(${container.count} trays)` : '(1 tray)';
      return `${totalCups} ${cupLabel} cups ${trayText}`;

    default:
      return `${container.count} × ${typeLabel}${plural}`;
  }
}

function getEmptyContainerForType(type: ContainerType): Partial<ContainerInfo> {
  // Return empty/undefined values - user must select
  switch (type) {
    case 'round_cake_tin':
    case 'square_cake_tin':
      return { size: undefined };
    case 'loaf_tin':
    case 'sheet_pan':
      return { length: undefined, width: undefined };
    case 'bundt_tin':
      return { capacity: undefined };
    case 'muffin_tin':
      return { cupSize: undefined, cupsPerTray: undefined };
    default:
      return { size: undefined };
  }
}

function isContainerComplete(container: ContainerInfo): boolean {
  // Count is required for all types
  if (!container.count) return false;

  switch (container.type) {
    case 'round_cake_tin':
    case 'square_cake_tin':
      return container.size !== undefined;
    case 'loaf_tin':
    case 'sheet_pan':
      return container.length !== undefined && container.width !== undefined;
    case 'bundt_tin':
      return container.capacity !== undefined;
    case 'muffin_tin':
      return container.cupSize !== undefined && container.cupsPerTray !== undefined;
    default:
      return false;
  }
}

function containersEqual(a: ContainerInfo, b: ContainerInfo): boolean {
  if (a.type !== b.type || a.count !== b.count) return false;

  switch (a.type) {
    case 'round_cake_tin':
    case 'square_cake_tin':
      return a.size === b.size;

    case 'loaf_tin':
    case 'sheet_pan':
      return a.length === b.length && a.width === b.width;

    case 'bundt_tin':
      return a.capacity === b.capacity;

    case 'muffin_tin':
      return a.cupSize === b.cupSize && a.cupsPerTray === b.cupsPerTray;

    default:
      return false;
  }
}

export default function ContainerScaleModal({
  isOpen,
  onClose,
  onApply,
  sourceContainer,
  recipeId,
  context,
}: ContainerScaleModalProps) {
  const [targetContainer, setTargetContainer] = useState<ContainerInfo>({
    ...sourceContainer,
  });
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showCountPicker, setShowCountPicker] = useState(false);
  const [showCupsPerTrayPicker, setShowCupsPerTrayPicker] = useState(false);
  const [result, setResult] = useState<AiContainerScaleResponse | null>(null);

  const aiContainerScale = useAiContainerScale();

  // Reset target container when source changes
  useEffect(() => {
    setTargetContainer({ ...sourceContainer });
  }, [sourceContainer]);

  const handleTypeChange = (type: ContainerType) => {
    setTargetContainer({
      type,
      count: undefined as unknown as number, // Clear count too
      ...getEmptyContainerForType(type),
    });
    setShowTypePicker(false);
  };

  const handleCalculate = () => {
    setResult(null);
    aiContainerScale.mutate(
      {
        recipeId,
        request: {
          sourceContainer,
          targetContainer,
          context,
        },
      },
      {
        onSuccess: (data) => {
          setResult(data);
        },
      }
    );
  };

  const handleApply = () => {
    if (result) {
      onApply(result.scaleFactor);
      handleClose();
    }
  };

  const handleClose = () => {
    setResult(null);
    aiContainerScale.reset();
    setTargetContainer({ ...sourceContainer });
    onClose();
  };

  const isContainerSame = containersEqual(targetContainer, sourceContainer);
  const isTargetComplete = isContainerComplete(targetContainer);
  const canCalculate = isTargetComplete && !isContainerSame;

  const renderSizePicker = () => {
    switch (targetContainer.type) {
      case 'round_cake_tin':
        return (
          <ScrollView style={styles.optionsList}>
            {ROUND_SIZES.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.optionItem,
                  targetContainer.size === size && styles.optionItemActive,
                ]}
                onPress={() => {
                  setTargetContainer({ ...targetContainer, size });
                  setShowSizePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    targetContainer.size === size && styles.optionTextActive,
                  ]}
                >
                  {size}" diameter
                </Text>
                {targetContainer.size === size && (
                  <Icon name="check" size="sm" color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      case 'square_cake_tin':
        return (
          <ScrollView style={styles.optionsList}>
            {SQUARE_SIZES.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.optionItem,
                  targetContainer.size === size && styles.optionItemActive,
                ]}
                onPress={() => {
                  setTargetContainer({ ...targetContainer, size });
                  setShowSizePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    targetContainer.size === size && styles.optionTextActive,
                  ]}
                >
                  {size}" × {size}"
                </Text>
                {targetContainer.size === size && (
                  <Icon name="check" size="sm" color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      case 'loaf_tin':
        return (
          <ScrollView style={styles.optionsList}>
            {LOAF_SIZES.map((loaf) => (
              <TouchableOpacity
                key={loaf.label}
                style={[
                  styles.optionItem,
                  targetContainer.length === loaf.length &&
                    targetContainer.width === loaf.width &&
                    styles.optionItemActive,
                ]}
                onPress={() => {
                  setTargetContainer({
                    ...targetContainer,
                    length: loaf.length,
                    width: loaf.width,
                  });
                  setShowSizePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    targetContainer.length === loaf.length &&
                      targetContainer.width === loaf.width &&
                      styles.optionTextActive,
                  ]}
                >
                  {loaf.label}
                </Text>
                {targetContainer.length === loaf.length &&
                  targetContainer.width === loaf.width && (
                    <Icon name="check" size="sm" color={colors.primary} />
                  )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      case 'bundt_tin':
        return (
          <ScrollView style={styles.optionsList}>
            {BUNDT_CAPACITIES.map((bundt) => (
              <TouchableOpacity
                key={bundt.capacity}
                style={[
                  styles.optionItem,
                  targetContainer.capacity === bundt.capacity && styles.optionItemActive,
                ]}
                onPress={() => {
                  setTargetContainer({ ...targetContainer, capacity: bundt.capacity });
                  setShowSizePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    targetContainer.capacity === bundt.capacity && styles.optionTextActive,
                  ]}
                >
                  {bundt.label}
                </Text>
                {targetContainer.capacity === bundt.capacity && (
                  <Icon name="check" size="sm" color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      case 'sheet_pan':
        return (
          <ScrollView style={styles.optionsList}>
            {SHEET_SIZES.map((sheet) => (
              <TouchableOpacity
                key={sheet.label}
                style={[
                  styles.optionItem,
                  targetContainer.length === sheet.length &&
                    targetContainer.width === sheet.width &&
                    styles.optionItemActive,
                ]}
                onPress={() => {
                  setTargetContainer({
                    ...targetContainer,
                    length: sheet.length,
                    width: sheet.width,
                  });
                  setShowSizePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    targetContainer.length === sheet.length &&
                      targetContainer.width === sheet.width &&
                      styles.optionTextActive,
                  ]}
                >
                  {sheet.label}
                </Text>
                {targetContainer.length === sheet.length &&
                  targetContainer.width === sheet.width && (
                    <Icon name="check" size="sm" color={colors.primary} />
                  )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      case 'muffin_tin':
        return (
          <ScrollView style={styles.optionsList}>
            {MUFFIN_CUP_SIZES.map((cup) => (
              <TouchableOpacity
                key={cup.value}
                style={[
                  styles.optionItem,
                  targetContainer.cupSize === cup.value && styles.optionItemActive,
                ]}
                onPress={() => {
                  setTargetContainer({ ...targetContainer, cupSize: cup.value });
                  setShowSizePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    targetContainer.cupSize === cup.value && styles.optionTextActive,
                  ]}
                >
                  {cup.label}
                </Text>
                {targetContainer.cupSize === cup.value && (
                  <Icon name="check" size="sm" color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      default:
        return (
          <ScrollView style={styles.optionsList}>
            {ROUND_SIZES.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.optionItem,
                  targetContainer.size === size && styles.optionItemActive,
                ]}
                onPress={() => {
                  setTargetContainer({ ...targetContainer, size });
                  setShowSizePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    targetContainer.size === size && styles.optionTextActive,
                  ]}
                >
                  {size}"
                </Text>
                {targetContainer.size === size && (
                  <Icon name="check" size="sm" color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        );
    }
  };

  const getSizeDisplayValue = (): string => {
    switch (targetContainer.type) {
      case 'round_cake_tin':
        return targetContainer.size ? `${targetContainer.size}" diameter` : 'Select...';
      case 'square_cake_tin':
        return targetContainer.size ? `${targetContainer.size}" × ${targetContainer.size}"` : 'Select...';
      case 'loaf_tin':
      case 'sheet_pan':
        return (targetContainer.length && targetContainer.width)
          ? `${targetContainer.length}" × ${targetContainer.width}"`
          : 'Select...';
      case 'bundt_tin':
        return targetContainer.capacity ? `${targetContainer.capacity}-cup` : 'Select...';
      case 'muffin_tin':
        const cupLabel = MUFFIN_CUP_SIZES.find((s) => s.value === targetContainer.cupSize)?.label;
        return cupLabel || 'Select...';
      default:
        return targetContainer.size ? `${targetContainer.size}"` : 'Select...';
    }
  };

  const isMuffinTin = targetContainer.type === 'muffin_tin';

  const getSizeLabel = (): string => {
    switch (targetContainer.type) {
      case 'bundt_tin':
        return 'Capacity';
      case 'muffin_tin':
        return 'Cup Size';
      default:
        return 'Size';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Scale by Container">
      {/* Current Container */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Current Container</Text>
        <View style={styles.currentContainer}>
          <Icon name="check_box_outline_blank" size="md" color={colors.dustyMauve} />
          <Text style={styles.currentContainerText}>{formatContainer(sourceContainer)}</Text>
        </View>
      </View>

      {/* Target Container */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Target Container</Text>

        {/* Type Picker */}
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowTypePicker(true)}
        >
          <Text style={styles.pickerButtonLabel}>Type</Text>
          <View style={styles.pickerButtonValue}>
            <Text style={styles.pickerButtonText}>
              {CONTAINER_TYPES.find((t) => t.value === targetContainer.type)?.label}
            </Text>
            <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
          </View>
        </TouchableOpacity>

        {/* Size and Count Row - different for muffin tins */}
        {isMuffinTin ? (
          <>
            {/* Muffin: Cup Size, Cups Per Tray, Number of Trays */}
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.pickerButton, styles.halfWidth]}
                onPress={() => setShowSizePicker(true)}
              >
                <Text style={styles.pickerButtonLabel}>Cup Size</Text>
                <View style={styles.pickerButtonValue}>
                  <Text style={[styles.pickerButtonText, getSizeDisplayValue() === 'Select...' && styles.pickerPlaceholder]}>
                    {getSizeDisplayValue()}
                  </Text>
                  <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pickerButton, styles.halfWidth]}
                onPress={() => setShowCupsPerTrayPicker(true)}
              >
                <Text style={styles.pickerButtonLabel}>Cups/Tray</Text>
                <View style={styles.pickerButtonValue}>
                  <Text style={[styles.pickerButtonText, !targetContainer.cupsPerTray && styles.pickerPlaceholder]}>
                    {targetContainer.cupsPerTray || 'Select...'}
                  </Text>
                  <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCountPicker(true)}
            >
              <Text style={styles.pickerButtonLabel}>Number of Trays</Text>
              <View style={styles.pickerButtonValue}>
                <Text style={[styles.pickerButtonText, !targetContainer.count && styles.pickerPlaceholder]}>
                  {targetContainer.count ? `${targetContainer.count} ${targetContainer.count === 1 ? 'tray' : 'trays'}` : 'Select...'}
                </Text>
                <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.pickerButton, styles.halfWidth]}
              onPress={() => setShowSizePicker(true)}
            >
              <Text style={styles.pickerButtonLabel}>{getSizeLabel()}</Text>
              <View style={styles.pickerButtonValue}>
                <Text style={[styles.pickerButtonText, getSizeDisplayValue() === 'Select...' && styles.pickerPlaceholder]}>
                  {getSizeDisplayValue()}
                </Text>
                <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pickerButton, styles.halfWidth]}
              onPress={() => setShowCountPicker(true)}
            >
              <Text style={styles.pickerButtonLabel}>Count</Text>
              <View style={styles.pickerButtonValue}>
                <Text style={[styles.pickerButtonText, !targetContainer.count && styles.pickerPlaceholder]}>
                  {targetContainer.count || 'Select...'}
                </Text>
                <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Calculate Button */}
      {!result && (
        <TouchableOpacity
          style={[styles.calculateButton, (!canCalculate || aiContainerScale.isPending) && styles.buttonDisabled]}
          onPress={handleCalculate}
          disabled={!canCalculate || aiContainerScale.isPending}
        >
          {aiContainerScale.isPending ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.white} size="small" />
              <Text style={styles.calculateButtonText}>Crumb is calculating...</Text>
            </View>
          ) : (
            <>
              <Icon name="auto_awesome" size="md" color={colors.white} />
              <Text style={styles.calculateButtonText}>Calculate Scale</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Error */}
      {aiContainerScale.isError && (
        <View style={styles.errorContainer}>
          <Icon name="error" size="md" color={colors.error} />
          <Text style={styles.errorText}>
            {aiContainerScale.error?.message || 'Failed to calculate scale. Please try again.'}
          </Text>
        </View>
      )}

      {/* Results */}
      {result && (
        <View style={styles.resultSection}>
          {/* Scale Factor */}
          <View style={styles.scaleFactorCard}>
            <Text style={styles.scaleFactorLabel}>Recommended Scale</Text>
            <Text style={styles.scaleFactorValue}>{result.scaleFactorDisplay}</Text>
          </View>

          {/* Explanation */}
          <Text style={styles.explanation}>{result.explanation}</Text>

          {/* Warning */}
          {result.warning && (
            <View style={styles.warningCard}>
              <Icon name="warning" size="md" color={colors.warning} />
              <Text style={styles.warningText}>{result.warning}</Text>
            </View>
          )}

          {/* Tips */}
          {result.tips.length > 0 && (
            <View style={styles.tipsSection}>
              <Text style={styles.tipsTitle}>Tips</Text>
              {result.tips.map((tip, index) => (
                <View key={index} style={styles.tipCard}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipSuggestion}>{tip.suggestion}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Adjusted Bake Settings */}
          {(result.adjustedBakeTime || result.adjustedBakeTemp) && (
            <View style={styles.adjustedSettings}>
              <Text style={styles.adjustedTitle}>Adjusted Baking</Text>
              <View style={styles.adjustedRow}>
                {result.adjustedBakeTime && (
                  <View style={styles.adjustedItem}>
                    <Icon name="timer" size="sm" color={colors.primary} />
                    <Text style={styles.adjustedValue}>{result.adjustedBakeTime} min</Text>
                  </View>
                )}
                {result.adjustedBakeTemp && (
                  <View style={styles.adjustedItem}>
                    <Icon name="thermostat" size="sm" color={colors.primary} />
                    <Text style={styles.adjustedValue}>
                      {result.adjustedBakeTemp}°{result.adjustedBakeTempUnit || 'F'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.recalculateButton} onPress={() => setResult(null)}>
              <Icon name="refresh" size="sm" color={colors.primary} />
              <Text style={styles.recalculateText}>Recalculate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Scale</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Type Picker Modal */}
      <Modal
        isOpen={showTypePicker}
        onClose={() => setShowTypePicker(false)}
        title="Container Type"
      >
        <ScrollView style={styles.optionsList}>
          {CONTAINER_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.optionItem,
                targetContainer.type === type.value && styles.optionItemActive,
              ]}
              onPress={() => handleTypeChange(type.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  targetContainer.type === type.value && styles.optionTextActive,
                ]}
              >
                {type.label}
              </Text>
              {targetContainer.type === type.value && (
                <Icon name="check" size="sm" color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>

      {/* Size Picker Modal */}
      <Modal
        isOpen={showSizePicker}
        onClose={() => setShowSizePicker(false)}
        title={getSizeLabel()}
      >
        {renderSizePicker()}
      </Modal>

      {/* Count Picker Modal */}
      <Modal
        isOpen={showCountPicker}
        onClose={() => setShowCountPicker(false)}
        title={isMuffinTin ? "Number of Trays" : "Container Count"}
      >
        <ScrollView style={styles.optionsList}>
          {(isMuffinTin ? TRAY_COUNTS : CONTAINER_COUNTS).map((count) => (
            <TouchableOpacity
              key={count}
              style={[
                styles.optionItem,
                targetContainer.count === count && styles.optionItemActive,
              ]}
              onPress={() => {
                setTargetContainer({ ...targetContainer, count });
                setShowCountPicker(false);
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  targetContainer.count === count && styles.optionTextActive,
                ]}
              >
                {isMuffinTin ? `${count} ${count === 1 ? 'tray' : 'trays'}` : count}
              </Text>
              {targetContainer.count === count && (
                <Icon name="check" size="sm" color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>

      {/* Cups Per Tray Picker Modal (muffin only) */}
      <Modal
        isOpen={showCupsPerTrayPicker}
        onClose={() => setShowCupsPerTrayPicker(false)}
        title="Cups Per Tray"
      >
        <ScrollView style={styles.optionsList}>
          {MUFFIN_CUPS_PER_TRAY.map((cups) => (
            <TouchableOpacity
              key={cups}
              style={[
                styles.optionItem,
                targetContainer.cupsPerTray === cups && styles.optionItemActive,
              ]}
              onPress={() => {
                setTargetContainer({ ...targetContainer, cupsPerTray: cups });
                setShowCupsPerTrayPicker(false);
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  targetContainer.cupsPerTray === cups && styles.optionTextActive,
                ]}
              >
                {cups} cups
              </Text>
              {targetContainer.cupsPerTray === cups && (
                <Icon name="check" size="sm" color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing[4],
  },
  sectionLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing[2],
  },
  currentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.bgLight,
    padding: spacing[3],
    borderRadius: borderRadius.lg,
  },
  currentContainerText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  halfWidth: {
    flex: 1,
  },
  pickerButton: {
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  pickerButtonLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    marginBottom: spacing[1],
  },
  pickerButtonValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerButtonText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  pickerPlaceholder: {
    color: colors.dustyMauve,
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    marginTop: spacing[2],
  },
  calculateButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: `${colors.error}15`,
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    marginTop: spacing[3],
  },
  errorText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.error,
  },
  resultSection: {
    marginTop: spacing[4],
  },
  scaleFactorCard: {
    backgroundColor: `${colors.primary}15`,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  scaleFactorLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
    marginBottom: spacing[1],
  },
  scaleFactorValue: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    color: colors.primary,
  },
  explanation: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing[3],
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    backgroundColor: `${colors.warning}15`,
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
  },
  warningText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.warning,
  },
  tipsSection: {
    marginBottom: spacing[3],
  },
  tipsTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing[2],
  },
  tipCard: {
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  tipTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing[1],
  },
  tipSuggestion: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  adjustedSettings: {
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  adjustedTitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing[2],
  },
  adjustedRow: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  adjustedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  adjustedValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  recalculateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[3],
  },
  recalculateText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.primary,
  },
  applyButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[3],
  },
  applyButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.white,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  optionItemActive: {
    backgroundColor: `${colors.primary}10`,
  },
  optionText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  optionTextActive: {
    fontFamily: fontFamily.medium,
    color: colors.primary,
  },
});
