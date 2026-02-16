import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { Icon } from '../common';
import PasteIngredientsModal from './PasteIngredientsModal';
import SupplierPicker from './SupplierPicker';
import { UNIT_PRESETS } from '../../constants/units';
import { CONTAINER_TYPES, CONTAINER_SIZES } from '../../constants/containers';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../../theme';
import { useTemperatureUnit } from '../../hooks/usePreferences';
import type { Recipe, Ingredient, CreateRecipeRequest, ContainerType } from '@proofed/shared';

interface RecipeFormProps {
  recipe?: Recipe;
  onSubmit: (data: CreateRecipeRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function RecipeForm({
  recipe,
  onSubmit,
  onCancel,
  isLoading,
}: RecipeFormProps) {
  const preferredTempUnit = useTemperatureUnit();
  const [name, setName] = useState(recipe?.name || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients || [{ name: '', quantity: 0, unit: '' }]
  );
  const [prepNotes, setPrepNotes] = useState(recipe?.prepNotes || '');
  const [bakeTime, setBakeTime] = useState<string>(recipe?.bakeTime?.toString() ?? '');
  const [bakeTemp, setBakeTemp] = useState<string>(recipe?.bakeTemp?.toString() ?? '');
  const [bakeTempUnit, setBakeTempUnit] = useState<'F' | 'C'>(recipe?.bakeTempUnit ?? preferredTempUnit);
  const [customScale, setCustomScale] = useState<string>(
    recipe?.customScales?.[0]?.toString() || ''
  );
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [supplierId, setSupplierId] = useState<string | null>(recipe?.supplierId ?? null);
  const [hasContainer, setHasContainer] = useState(!!recipe?.container);
  const [containerType, setContainerType] = useState<ContainerType>(
    recipe?.container?.type ?? 'round_cake_tin'
  );
  const [containerSize, setContainerSize] = useState<number>(recipe?.container?.size ?? 8);
  const [containerCount, setContainerCount] = useState<string>(
    recipe?.container?.count?.toString() ?? '1'
  );
  const [showContainerTypePicker, setShowContainerTypePicker] = useState(false);
  const [showContainerSizePicker, setShowContainerSizePicker] = useState(false);

  const handleSubmit = () => {
    const validIngredients = ingredients.filter((i) => i.name.trim());
    const parsedCustomScale = parseFloat(customScale);
    const parsedCount = parseInt(containerCount) || 1;

    // Determine custom scales value:
    // - Valid number > 0: save as array with single element
    // - Empty/invalid when editing: send null to remove
    // - Empty/invalid when creating: send undefined (don't include)
    let customScalesValue: number[] | null | undefined;
    if (!isNaN(parsedCustomScale) && parsedCustomScale > 0) {
      customScalesValue = [parsedCustomScale];
    } else if (recipe) {
      // Editing and field is empty - explicitly remove
      customScalesValue = null;
    } else {
      // Creating new - just don't include
      customScalesValue = undefined;
    }

    onSubmit({
      name,
      ingredients: validIngredients,
      prepNotes: prepNotes || (recipe ? null : undefined),
      bakeTime: bakeTime ? parseInt(bakeTime) : (recipe ? null : undefined),
      bakeTemp: bakeTemp ? parseInt(bakeTemp) : (recipe ? null : undefined),
      bakeTempUnit: bakeTemp ? bakeTempUnit : undefined,
      customScales: customScalesValue,
      container: hasContainer && parsedCount
        ? {
            type: containerType,
            size: containerSize,
            count: parsedCount,
          }
        : (recipe ? null : undefined),
      supplierId: supplierId || (recipe ? null : undefined),
    } as any);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: 0, unit: '' }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handlePastedIngredients = (newIngredients: Ingredient[]) => {
    const existingNonEmpty = ingredients.filter((i) => i.name.trim());
    setIngredients([...existingNonEmpty, ...newIngredients]);
  };

  const selectedContainerType = CONTAINER_TYPES.find((t) => t.value === containerType);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.field}>
        <Text style={styles.label}>Recipe Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Grandma's Recipe"
          placeholderTextColor={colors.dustyMauve}
          autoFocus
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          Recipe Source <Text style={styles.optional}>(optional)</Text>
        </Text>
        <SupplierPicker value={supplierId} onChange={setSupplierId} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Ingredients</Text>
        {ingredients.map((ingredient, index) => (
          <View key={index} style={styles.ingredientRow}>
            <TextInput
              style={[styles.input, styles.nameInput]}
              value={ingredient.name}
              onChangeText={(text) => updateIngredient(index, 'name', text)}
              placeholder="Ingredient"
              placeholderTextColor={colors.dustyMauve}
            />
            <TextInput
              style={[styles.input, styles.qtyInput]}
              value={ingredient.quantity ? String(ingredient.quantity) : ''}
              onChangeText={(text) =>
                updateIngredient(index, 'quantity', parseFloat(text) || 0)
              }
              placeholder="Qty"
              placeholderTextColor={colors.dustyMauve}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.input, styles.unitInput]}
              value={ingredient.unit}
              onChangeText={(text) => updateIngredient(index, 'unit', text)}
              placeholder="Unit"
              placeholderTextColor={colors.dustyMauve}
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeIngredient(index)}
            >
              <Icon name="close" size="sm" color={colors.dustyMauve} />
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.ingredientButtons}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={addIngredient}
            activeOpacity={0.7}
          >
            <Icon name="add" size="sm" color={colors.primary} />
            <Text style={styles.addButtonText}>Add Ingredient</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pasteButton}
            onPress={() => setShowPasteModal(true)}
            activeOpacity={0.7}
          >
            <Icon name="content_paste" size="sm" color={colors.primary} />
            <Text style={styles.addButtonText}>Paste</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          Bake Settings <Text style={styles.optional}>(optional)</Text>
        </Text>
        <View style={styles.bakeSettingsRow}>
          <View style={styles.bakeField}>
            <Text style={styles.subLabel}>Time (min)</Text>
            <TextInput
              style={styles.input}
              value={bakeTime}
              onChangeText={setBakeTime}
              placeholder="25"
              placeholderTextColor={colors.dustyMauve}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.bakeField}>
            <Text style={styles.subLabel}>Temperature</Text>
            <TextInput
              style={styles.input}
              value={bakeTemp}
              onChangeText={setBakeTemp}
              placeholder="350"
              placeholderTextColor={colors.dustyMauve}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.tempUnitField}>
            <Text style={styles.subLabel}>Unit</Text>
            <View style={styles.tempUnitRow}>
              <TouchableOpacity
                style={[
                  styles.tempUnitButton,
                  bakeTempUnit === 'F' && styles.tempUnitButtonActive,
                ]}
                onPress={() => setBakeTempUnit('F')}
              >
                <Text
                  style={[
                    styles.tempUnitText,
                    bakeTempUnit === 'F' && styles.tempUnitTextActive,
                  ]}
                >
                  °F
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tempUnitButton,
                  bakeTempUnit === 'C' && styles.tempUnitButtonActive,
                ]}
                onPress={() => setBakeTempUnit('C')}
              >
                <Text
                  style={[
                    styles.tempUnitText,
                    bakeTempUnit === 'C' && styles.tempUnitTextActive,
                  ]}
                >
                  °C
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          Custom Scale <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={customScale}
          onChangeText={setCustomScale}
          placeholder="e.g., 0.75 or 1.5"
          placeholderTextColor={colors.dustyMauve}
          keyboardType="decimal-pad"
        />
        <Text style={styles.hint}>Add a custom scale factor for this recipe</Text>
      </View>

      <View style={styles.field}>
        <View style={styles.containerHeader}>
          <Text style={styles.label}>
            Container <Text style={styles.optional}>(optional)</Text>
          </Text>
          <Switch
            value={hasContainer}
            onValueChange={setHasContainer}
            trackColor={{ false: 'rgba(0,0,0,0.2)', true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
        {hasContainer && (
          <View style={styles.containerRow}>
            <View style={styles.countField}>
              <Text style={styles.subLabel}>Count</Text>
              <TextInput
                style={[styles.input, styles.countInput]}
                value={containerCount}
                onChangeText={setContainerCount}
                placeholder="1"
                placeholderTextColor={colors.dustyMauve}
                keyboardType="number-pad"
              />
            </View>
            <Text style={styles.multiply}>×</Text>
            <View style={styles.sizeField}>
              <Text style={styles.subLabel}>Size</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowContainerSizePicker(!showContainerSizePicker)}
              >
                <Text style={styles.pickerButtonText}>{containerSize}"</Text>
                <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
              </TouchableOpacity>
              {showContainerSizePicker && (
                <View style={styles.pickerDropdown}>
                  {CONTAINER_SIZES.map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.pickerOption,
                        containerSize === size && styles.pickerOptionActive,
                      ]}
                      onPress={() => {
                        setContainerSize(size);
                        setShowContainerSizePicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          containerSize === size && styles.pickerOptionTextActive,
                        ]}
                      >
                        {size}"
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.typeField}>
              <Text style={styles.subLabel}>Type</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowContainerTypePicker(!showContainerTypePicker)}
              >
                <Text style={styles.pickerButtonText} numberOfLines={1}>
                  {selectedContainerType?.label || 'Select'}
                </Text>
                <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
              </TouchableOpacity>
              {showContainerTypePicker && (
                <View style={styles.pickerDropdown}>
                  {CONTAINER_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.pickerOption,
                        containerType === type.value && styles.pickerOptionActive,
                      ]}
                      onPress={() => {
                        setContainerType(type.value);
                        setShowContainerTypePicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          containerType === type.value && styles.pickerOptionTextActive,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Preparation Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={prepNotes}
          onChangeText={setPrepNotes}
          placeholder="Instructions and tips"
          placeholderTextColor={colors.dustyMauve}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (isLoading || !name.trim()) && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isLoading || !name.trim()}
          activeOpacity={0.7}
        >
          <Text style={styles.submitButtonText}>
            {recipe ? 'Update' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <PasteIngredientsModal
        isOpen={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        onAdd={handlePastedIngredients}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  field: {
    marginBottom: spacing[4],
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing[2],
  },
  optional: {
    fontFamily: fontFamily.regular,
    color: colors.dustyMauve,
  },
  subLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    marginBottom: spacing[1],
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    marginTop: spacing[1],
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.xl,
    height: 48,
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
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  nameInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.bgLight,
  },
  qtyInput: {
    width: 60,
    height: 44,
    backgroundColor: colors.bgLight,
    textAlign: 'center',
    paddingHorizontal: spacing[2],
  },
  unitInput: {
    width: 60,
    height: 44,
    backgroundColor: colors.bgLight,
    textAlign: 'center',
    paddingHorizontal: spacing[2],
  },
  removeButton: {
    padding: spacing[2],
  },
  ingredientButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.pastelPink,
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.pastelPink,
  },
  addButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  bakeSettingsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  bakeField: {
    flex: 1,
  },
  tempUnitField: {
    width: 80,
  },
  tempUnitRow: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  tempUnitButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: colors.white,
  },
  tempUnitButtonActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
  },
  tempUnitText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  tempUnitTextActive: {
    color: colors.primary,
  },
  containerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  containerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  countField: {
    width: 60,
  },
  countInput: {
    textAlign: 'center',
    paddingHorizontal: spacing[2],
  },
  multiply: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.lg,
    color: colors.dustyMauve,
    marginBottom: spacing[3],
  },
  sizeField: {
    width: 70,
    position: 'relative',
  },
  typeField: {
    flex: 1,
    position: 'relative',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: colors.white,
  },
  pickerButtonText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
    flex: 1,
  },
  pickerDropdown: {
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 100,
    maxHeight: 200,
  },
  pickerOption: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  pickerOptionActive: {
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
  },
  pickerOptionText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  pickerOptionTextActive: {
    fontFamily: fontFamily.medium,
    color: colors.primary,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingTop: spacing[2],
    paddingBottom: spacing[6],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
  },
  submitButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.white,
  },
});
