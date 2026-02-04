import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Icon, Loading, Modal } from '../components/common';
import { useItems } from '../hooks/useItems';
import { useRecipes } from '../hooks/useRecipes';
import { useVariants } from '../hooks/useVariants';
import { useCreateAttempt } from '../hooks/useAttempts';
import { getScaleOptions } from '../utils/scaleRecipe';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../theme';
import type { ItemUsage, Item } from '@proofed/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

interface ItemUsageInput extends ItemUsage {
  _key: string;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function NewAttemptScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { data: items, isLoading: itemsLoading } = useItems();
  const createAttempt = useCreateAttempt();

  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [itemUsages, setItemUsages] = useState<ItemUsageInput[]>([]);

  const addItemUsage = () => {
    setItemUsages([
      ...itemUsages,
      { _key: Date.now().toString(), itemId: '', recipeId: '' },
    ]);
  };

  const updateItemUsage = (key: string, updates: Partial<ItemUsageInput>) => {
    setItemUsages(
      itemUsages.map((usage) =>
        usage._key === key ? { ...usage, ...updates } : usage
      )
    );
  };

  const removeItemUsage = (key: string) => {
    setItemUsages(itemUsages.filter((usage) => usage._key !== key));
  };

  const handleSubmit = () => {
    const validUsages = itemUsages
      .filter((u) => u.itemId && u.recipeId)
      .map(({ _key, ...usage }) => usage);

    createAttempt.mutate(
      {
        name,
        date,
        itemUsages: validUsages,
        notes: notes || undefined,
      },
      {
        onSuccess: (attempt) =>
          navigation.navigate('AttemptDetail', { attemptId: attempt.attemptId }),
      }
    );
  };

  if (itemsLoading) return <Loading />;

  const isValid = name.trim() && !createAttempt.isPending;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Icon name="close" color={colors.primary} size="lg" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Attempt</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isValid}
          style={styles.saveButton}
        >
          <Text style={[styles.saveText, !isValid && styles.saveTextDisabled]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Info</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Attempt Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Vanilla Cake Test #1"
              placeholderTextColor={colors.dustyMauve}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.dustyMauve}
            />
          </View>
        </View>

        {/* Items Used */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items Used</Text>
            <TouchableOpacity onPress={addItemUsage}>
              <Text style={styles.addLink}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {itemUsages.map((usage) => (
            <ItemUsageRow
              key={usage._key}
              usage={usage}
              items={items || []}
              onUpdate={(updates) => updateItemUsage(usage._key, updates)}
              onRemove={() => removeItemUsage(usage._key)}
            />
          ))}

          {itemUsages.length === 0 && (
            <TouchableOpacity style={styles.emptyButton} onPress={addItemUsage}>
              <Icon name="add_circle" size="lg" color={colors.dustyMauve} />
              <Text style={styles.emptyText}>Add items from your library</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any notes about this bake..."
            placeholderTextColor={colors.dustyMauve}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[4] }]}>
        <TouchableOpacity
          style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isValid}
        >
          <Icon name="save" color={isValid ? colors.white : colors.dustyMauve} size="md" />
          <Text style={[styles.submitButtonText, !isValid && styles.submitButtonTextDisabled]}>
            Create Attempt
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ItemUsageRow({
  usage,
  items,
  onUpdate,
  onRemove,
}: {
  usage: ItemUsageInput;
  items: Item[];
  onUpdate: (updates: Partial<ItemUsageInput>) => void;
  onRemove: () => void;
}) {
  const { data: recipes } = useRecipes(usage.itemId);
  const { data: variants } = useVariants(usage.itemId, usage.recipeId);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [showVariantPicker, setShowVariantPicker] = useState(false);

  const selectedItem = items.find((i) => i.itemId === usage.itemId);
  const selectedRecipe = recipes?.find((r) => r.recipeId === usage.recipeId);
  const selectedVariant = variants?.find((v) => v.variantId === usage.variantId);

  return (
    <View style={styles.usageCard}>
      <View style={styles.usageHeader}>
        <View style={styles.usageContent}>
          {/* Item Picker */}
          <View style={styles.pickerField}>
            <Text style={styles.pickerLabel}>Item</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowItemPicker(true)}
            >
              <Text
                style={[styles.pickerText, !selectedItem && styles.pickerPlaceholder]}
                numberOfLines={1}
              >
                {selectedItem?.name || 'Select item...'}
              </Text>
              <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
            </TouchableOpacity>
          </View>

          {/* Recipe Picker */}
          {usage.itemId && (
            <View style={styles.pickerField}>
              <Text style={styles.pickerLabel}>Recipe</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowRecipePicker(true)}
              >
                <Text
                  style={[styles.pickerText, !selectedRecipe && styles.pickerPlaceholder]}
                  numberOfLines={1}
                >
                  {selectedRecipe?.name || 'Select recipe...'}
                </Text>
                <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
              </TouchableOpacity>
            </View>
          )}

          {/* Variant Picker */}
          {usage.recipeId && variants && variants.length > 0 && (
            <View style={styles.pickerField}>
              <Text style={styles.pickerLabel}>Variant (optional)</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowVariantPicker(true)}
              >
                <Text
                  style={[styles.pickerText, !selectedVariant && styles.pickerPlaceholder]}
                  numberOfLines={1}
                >
                  {selectedVariant?.name || 'Base recipe'}
                </Text>
                <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
              </TouchableOpacity>
            </View>
          )}

          {/* Scale Selector */}
          {usage.recipeId && (
            <View style={styles.pickerField}>
              <Text style={styles.pickerLabel}>Scale</Text>
              <View style={styles.scaleButtons}>
                {getScaleOptions(selectedRecipe?.customScales).map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.scaleButton,
                      (usage.scaleFactor ?? 1) === option.value && styles.scaleButtonActive,
                    ]}
                    onPress={() =>
                      onUpdate({ scaleFactor: option.value === 1 ? undefined : option.value })
                    }
                  >
                    <Text
                      style={[
                        styles.scaleButtonText,
                        (usage.scaleFactor ?? 1) === option.value && styles.scaleButtonTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Notes */}
          <View style={styles.pickerField}>
            <Text style={styles.pickerLabel}>Notes for this item</Text>
            <TextInput
              style={[styles.picker, styles.notesInput]}
              value={usage.notes || ''}
              onChangeText={(text) => onUpdate({ notes: text || undefined })}
              placeholder="Any specific notes..."
              placeholderTextColor={colors.dustyMauve}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <Icon name="close" color={colors.dustyMauve} size="md" />
        </TouchableOpacity>
      </View>

      {/* Item Picker Modal */}
      <Modal isOpen={showItemPicker} onClose={() => setShowItemPicker(false)} title="Select Item">
        <ScrollView style={styles.pickerList}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.itemId}
              style={styles.pickerOption}
              onPress={() => {
                onUpdate({ itemId: item.itemId, recipeId: '', variantId: undefined });
                setShowItemPicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>

      {/* Recipe Picker Modal */}
      <Modal
        isOpen={showRecipePicker}
        onClose={() => setShowRecipePicker(false)}
        title="Select Recipe"
      >
        <ScrollView style={styles.pickerList}>
          {(recipes || []).map((recipe) => (
            <TouchableOpacity
              key={recipe.recipeId}
              style={styles.pickerOption}
              onPress={() => {
                onUpdate({ recipeId: recipe.recipeId, variantId: undefined });
                setShowRecipePicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>{recipe.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>

      {/* Variant Picker Modal */}
      <Modal
        isOpen={showVariantPicker}
        onClose={() => setShowVariantPicker(false)}
        title="Select Variant"
      >
        <ScrollView style={styles.pickerList}>
          <TouchableOpacity
            style={styles.pickerOption}
            onPress={() => {
              onUpdate({ variantId: undefined });
              setShowVariantPicker(false);
            }}
          >
            <Text style={styles.pickerOptionText}>Base recipe</Text>
          </TouchableOpacity>
          {(variants || []).map((variant) => (
            <TouchableOpacity
              key={variant.variantId}
              style={styles.pickerOption}
              onPress={() => {
                onUpdate({ variantId: variant.variantId });
                setShowVariantPicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>{variant.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing[2],
  },
  headerTitle: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: spacing[2],
  },
  saveText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.primary,
  },
  saveTextDisabled: {
    color: 'rgba(157, 129, 137, 0.5)',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  section: {
    marginTop: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[2],
  },
  addLink: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  field: {
    marginBottom: spacing[3],
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing[2],
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.xl,
    height: 56,
    paddingHorizontal: spacing[4],
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  textArea: {
    height: 100,
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    textAlignVertical: 'top',
  },
  usageCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  usageContent: {
    flex: 1,
  },
  removeButton: {
    padding: spacing[2],
    marginLeft: spacing[2],
    marginTop: -spacing[2],
    marginRight: -spacing[2],
  },
  pickerField: {
    marginBottom: spacing[3],
  },
  pickerLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing[2],
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.xl,
    height: 48,
    paddingHorizontal: spacing[4],
  },
  pickerText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  pickerPlaceholder: {
    color: colors.dustyMauve,
  },
  notesInput: {
    height: 60,
    paddingTop: spacing[3],
    textAlignVertical: 'top',
  },
  scaleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
  },
  scaleButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgLight,
  },
  scaleButtonActive: {
    backgroundColor: colors.primary,
  },
  scaleButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  scaleButtonTextActive: {
    color: colors.white,
  },
  emptyButton: {
    padding: spacing[8],
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.pastelPink,
    backgroundColor: 'rgba(244, 172, 183, 0.1)',
    alignItems: 'center',
    gap: spacing[2],
  },
  emptyText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[4],
    backgroundColor: colors.bgLight,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(157, 129, 137, 0.3)',
  },
  submitButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.white,
  },
  submitButtonTextDisabled: {
    color: colors.dustyMauve,
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerOption: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  pickerOptionText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
});
