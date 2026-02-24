import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Modal, Icon } from '../common';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../../theme';
import type { ContainerInfo, ContainerType, MuffinCupSize } from '@proofed/shared';

const CONTAINER_TYPES: { value: ContainerType; label: string; icon: string }[] = [
  { value: 'round_cake_tin', label: 'Round Cake Tin', icon: 'panorama_fish_eye' },
  { value: 'square_cake_tin', label: 'Square Cake Tin', icon: 'crop_square' },
  { value: 'loaf_tin', label: 'Loaf Tin', icon: 'rectangle' },
  { value: 'bundt_tin', label: 'Bundt Tin', icon: 'donut_large' },
  { value: 'sheet_pan', label: 'Sheet Pan', icon: 'crop_landscape' },
  { value: 'muffin_tin', label: 'Muffin Tin', icon: 'grid_view' },
];

// Type-specific size options
const ROUND_SIZES: number[] = [6, 7, 8, 9, 10, 12];
const SQUARE_SIZES: number[] = [8, 9, 10];
const LOAF_SIZES: { length: number; width: number; label: string }[] = [
  { length: 8, width: 4, label: '8" x 4"' },
  { length: 8.5, width: 4.5, label: '8.5" x 4.5"' },
  { length: 9, width: 5, label: '9" x 5"' },
];
const BUNDT_CAPACITIES: { capacity: number; label: string }[] = [
  { capacity: 6, label: '6-cup' },
  { capacity: 9, label: '9-cup' },
  { capacity: 10, label: '10-cup' },
  { capacity: 12, label: '12-cup' },
  { capacity: 15, label: '15-cup' },
];
const SHEET_SIZES: { length: number; width: number; label: string }[] = [
  { length: 9, width: 13, label: '9" x 13" (Quarter)' },
  { length: 11, width: 7, label: '11" x 7"' },
  { length: 13, width: 18, label: '13" x 18" (Half)' },
];
const MUFFIN_CUP_SIZES: { value: MuffinCupSize; label: string }[] = [
  { value: 'mini', label: 'Mini' },
  { value: 'standard', label: 'Standard' },
  { value: 'jumbo', label: 'Jumbo' },
];
const MUFFIN_CUPS_PER_TRAY: number[] = [4, 6, 12, 24];

interface ContainerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (container: ContainerInfo) => void;
}

function isContainerComplete(container: Partial<ContainerInfo>): container is ContainerInfo {
  if (!container.type || !container.count) return false;

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

export default function ContainerSelectModal({
  isOpen,
  onClose,
  onSelect,
}: ContainerSelectModalProps) {
  const [step, setStep] = useState<'type' | 'size'>('type');
  const [container, setContainer] = useState<Partial<ContainerInfo>>({});

  const handleTypeSelect = (type: ContainerType) => {
    setContainer({ type, count: 1 });
    setStep('size');
  };

  const handleSizeSelect = (sizeProps: Partial<ContainerInfo>) => {
    const updated = { ...container, ...sizeProps };
    setContainer(updated);
    if (isContainerComplete(updated)) {
      onSelect(updated);
      handleClose();
    }
  };

  const handleClose = () => {
    setStep('type');
    setContainer({});
    onClose();
  };

  const renderTypeGrid = () => (
    <View style={styles.typeGrid}>
      {CONTAINER_TYPES.map((type) => (
        <TouchableOpacity
          key={type.value}
          style={styles.typeCard}
          onPress={() => handleTypeSelect(type.value)}
        >
          <Icon name={type.icon} size="xl" color={colors.primary} />
          <Text style={styles.typeLabel}>{type.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSizeOptions = () => {
    switch (container.type) {
      case 'round_cake_tin':
        return (
          <ScrollView style={styles.optionsList}>
            {ROUND_SIZES.map((size) => (
              <TouchableOpacity
                key={size}
                style={styles.optionItem}
                onPress={() => handleSizeSelect({ size })}
              >
                <Text style={styles.optionText}>{size}" diameter</Text>
                <Icon name="chevron_right" size="sm" color={colors.dustyMauve} />
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
                style={styles.optionItem}
                onPress={() => handleSizeSelect({ size })}
              >
                <Text style={styles.optionText}>{size}" x {size}"</Text>
                <Icon name="chevron_right" size="sm" color={colors.dustyMauve} />
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
                style={styles.optionItem}
                onPress={() => handleSizeSelect({ length: loaf.length, width: loaf.width })}
              >
                <Text style={styles.optionText}>{loaf.label}</Text>
                <Icon name="chevron_right" size="sm" color={colors.dustyMauve} />
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
                style={styles.optionItem}
                onPress={() => handleSizeSelect({ capacity: bundt.capacity })}
              >
                <Text style={styles.optionText}>{bundt.label}</Text>
                <Icon name="chevron_right" size="sm" color={colors.dustyMauve} />
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
                style={styles.optionItem}
                onPress={() => handleSizeSelect({ length: sheet.length, width: sheet.width })}
              >
                <Text style={styles.optionText}>{sheet.label}</Text>
                <Icon name="chevron_right" size="sm" color={colors.dustyMauve} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      case 'muffin_tin':
        return (
          <MuffinTinSelector
            onSelect={(cupSize, cupsPerTray) =>
              handleSizeSelect({ cupSize, cupsPerTray })
            }
          />
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    if (step === 'type') return 'What did you bake this in?';
    const typeLabel = CONTAINER_TYPES.find((t) => t.value === container.type)?.label;
    return `Select ${typeLabel} Size`;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={getStepTitle()}>
      {step === 'type' && renderTypeGrid()}
      {step === 'size' && (
        <View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('type')}
          >
            <Icon name="arrow_back" size="sm" color={colors.primary} />
            <Text style={styles.backButtonText}>Back to container types</Text>
          </TouchableOpacity>
          {renderSizeOptions()}
        </View>
      )}
    </Modal>
  );
}

// Muffin tin needs two selections
function MuffinTinSelector({
  onSelect,
}: {
  onSelect: (cupSize: MuffinCupSize, cupsPerTray: number) => void;
}) {
  const [cupSize, setCupSize] = useState<MuffinCupSize | null>(null);

  if (!cupSize) {
    return (
      <ScrollView style={styles.optionsList}>
        <Text style={styles.subLabel}>Cup Size</Text>
        {MUFFIN_CUP_SIZES.map((cup) => (
          <TouchableOpacity
            key={cup.value}
            style={styles.optionItem}
            onPress={() => setCupSize(cup.value)}
          >
            <Text style={styles.optionText}>{cup.label}</Text>
            <Icon name="chevron_right" size="sm" color={colors.dustyMauve} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.optionsList}>
      <TouchableOpacity style={styles.backRow} onPress={() => setCupSize(null)}>
        <Icon name="arrow_back" size="sm" color={colors.primary} />
        <Text style={styles.backRowText}>
          {MUFFIN_CUP_SIZES.find((c) => c.value === cupSize)?.label} cups
        </Text>
      </TouchableOpacity>
      <Text style={styles.subLabel}>Cups Per Tray</Text>
      {MUFFIN_CUPS_PER_TRAY.map((cups) => (
        <TouchableOpacity
          key={cups}
          style={styles.optionItem}
          onPress={() => onSelect(cupSize, cups)}
        >
          <Text style={styles.optionText}>{cups} cups</Text>
          <Icon name="chevron_right" size="sm" color={colors.dustyMauve} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    paddingBottom: spacing[4],
  },
  typeCard: {
    width: '47%',
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    alignItems: 'center',
    gap: spacing[2],
  },
  typeLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingBottom: spacing[3],
    marginBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  backButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  optionsList: {
    maxHeight: 350,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  optionText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  subLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    marginBottom: spacing[2],
    marginTop: spacing[2],
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  backRowText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
});
