import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { Icon } from '../common';
import PasteIngredientsModal from './PasteIngredientsModal';
import SupplierPicker from './SupplierPicker';
import IngredientAutocomplete from './IngredientAutocomplete';
import ProductAutocomplete from './ProductAutocomplete';
import { UNIT_PRESETS } from '../../constants/units';
import { CONTAINER_TYPES, CONTAINER_SIZES } from '../../constants/containers';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../../theme';
import { useTemperatureUnit } from '../../hooks/usePreferences';
import type { Recipe, Ingredient, CreateRecipeRequest, ContainerType } from '@proofed/shared';

type RecipeMode = 'homemade' | 'store-bought';

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

  // Determine initial mode based on existing recipe
  const initialMode: RecipeMode = recipe?.isStoreBought ? 'store-bought' : 'homemade';
  const [mode, setMode] = useState<RecipeMode>(initialMode);

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

  // Store-bought fields
  const [brand, setBrand] = useState(recipe?.brand || '');
  const [productName, setProductName] = useState(recipe?.productName || '');
  const [purchaseQuantity, setPurchaseQuantity] = useState(recipe?.purchaseQuantity || '');
  const [purchaseUnit, setPurchaseUnit] = useState(recipe?.purchaseUnit || '');
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const handleSubmit = () => {
    const isStoreBought = mode === 'store-bought';

    if (isStoreBought) {
      // Store-bought recipe - use brand as name if no name set
      const recipeName = name.trim() || (brand && productName ? `${brand} ${productName}` : brand || productName);

      onSubmit({
        name: recipeName,
        ingredients: [], // Store-bought items have no ingredients
        isStoreBought: true,
        brand: brand || undefined,
        productName: productName || undefined,
        purchaseQuantity: purchaseQuantity || undefined,
        purchaseUnit: purchaseUnit || undefined,
        prepNotes: prepNotes || (recipe ? null : undefined),
      } as any);
    } else {
      // Homemade recipe - original logic
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
        isStoreBought: false,
        // Clear store-bought fields when switching to homemade
        brand: recipe?.isStoreBought ? null : undefined,
        productName: recipe?.isStoreBought ? null : undefined,
        purchaseQuantity: recipe?.isStoreBought ? null : undefined,
        purchaseUnit: recipe?.isStoreBought ? null : undefined,
      } as any);
    }
  };

  const handleProductSelect = (product: {
    brand: string;
    productName: string;
    purchaseQuantity: string;
    purchaseUnit: string;
  }) => {
    setBrand(product.brand);
    setProductName(product.productName);
    setPurchaseQuantity(product.purchaseQuantity);
    setPurchaseUnit(product.purchaseUnit);
    // Auto-set name based on product
    if (product.brand && product.productName) {
      setName(`${product.brand} ${product.productName}`);
    } else if (product.brand) {
      setName(product.brand);
    } else if (product.productName) {
      setName(product.productName);
    }
  };

  const isStoreBoughtValid = mode === 'store-bought' && (brand.trim() || productName.trim() || name.trim());
  const isHomemadeValid = mode === 'homemade' && name.trim();
  const canSubmit = isStoreBoughtValid || isHomemadeValid;

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

  // Package size unit options for store-bought
  const PACKAGE_UNITS = ['g', 'kg', 'ml', 'L', 'oz', 'lb', 'fl oz', 'unit', 'piece'];

  return (
    <View style={styles.container}>
      {/* Mode Toggle */}
      <View style={styles.field}>
        <Text style={styles.label}>Recipe Type</Text>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'homemade' && styles.modeButtonActive]}
            onPress={() => setMode('homemade')}
          >
            <Icon name="restaurant" size="sm" color={mode === 'homemade' ? colors.white : colors.dustyMauve} />
            <Text style={[styles.modeButtonText, mode === 'homemade' && styles.modeButtonTextActive]}>
              Homemade
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'store-bought' && styles.modeButtonActive]}
            onPress={() => setMode('store-bought')}
          >
            <Icon name="shopping_cart" size="sm" color={mode === 'store-bought' ? colors.white : colors.dustyMauve} />
            <Text style={[styles.modeButtonText, mode === 'store-bought' && styles.modeButtonTextActive]}>
              Store-bought
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {mode === 'store-bought' ? (
        <>
          {/* Store-bought form */}
          <View style={[styles.field, styles.autocompleteField]}>
            <View style={styles.autocompleteHeader}>
              <Text style={styles.label}>Search Product</Text>
              <Text style={styles.autocompleteHint}>Search Open Food Facts or enter custom details below</Text>
            </View>
            <ProductAutocomplete onSelect={handleProductSelect} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Brand</Text>
            <TextInput
              style={styles.input}
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g., Bonne Maman"
              placeholderTextColor={colors.dustyMauve}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Product Name <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={productName}
              onChangeText={setProductName}
              placeholder="e.g., Raspberry Conserve"
              placeholderTextColor={colors.dustyMauve}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Package Size <Text style={styles.optional}>(optional)</Text>
            </Text>
            <View style={styles.packageSizeRow}>
              <TextInput
                style={[styles.input, styles.packageQtyInput]}
                value={purchaseQuantity}
                onChangeText={setPurchaseQuantity}
                placeholder="370"
                placeholderTextColor={colors.dustyMauve}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity
                style={styles.unitPickerButton}
                onPress={() => setShowUnitPicker(!showUnitPicker)}
              >
                <Text style={styles.unitPickerText}>{purchaseUnit || 'Unit'}</Text>
                <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
              </TouchableOpacity>
            </View>
            {showUnitPicker && (
              <View style={styles.unitPickerDropdown}>
                {PACKAGE_UNITS.map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[styles.unitOption, purchaseUnit === unit && styles.unitOptionActive]}
                    onPress={() => {
                      setPurchaseUnit(unit);
                      setShowUnitPicker(false);
                    }}
                  >
                    <Text style={[styles.unitOptionText, purchaseUnit === unit && styles.unitOptionTextActive]}>
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Notes <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={prepNotes}
              onChangeText={setPrepNotes}
              placeholder="Where to buy, quality notes, etc."
              placeholderTextColor={colors.dustyMauve}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </>
      ) : (
        <>
          {/* Homemade form - original fields */}
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
          <View key={index} style={[styles.ingredientRow, { zIndex: 100 - index }]}>
            <View style={styles.nameInputWrapper}>
              <IngredientAutocomplete
                value={ingredient.name}
                onChangeText={(text) => updateIngredient(index, 'name', text)}
                placeholder="Ingredient"
                style={styles.nameInput}
              />
            </View>
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
        </>
      )}

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
            (isLoading || !canSubmit) && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isLoading || !canSubmit}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  field: {
    marginBottom: spacing[4],
  },
  autocompleteField: {
    zIndex: 100,
    position: 'relative',
  },
  autocompleteHeader: {
    marginBottom: spacing[2],
  },
  autocompleteHint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    marginTop: spacing[1],
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
  nameInputWrapper: {
    flex: 1,
    zIndex: 10,
  },
  nameInput: {
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
  // Mode toggle styles
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.xl,
    padding: spacing[1],
    gap: spacing[1],
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  modeButtonTextActive: {
    color: colors.white,
  },
  // Store-bought specific styles
  packageSizeRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  packageQtyInput: {
    flex: 1,
  },
  unitPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.xl,
    height: 48,
    paddingHorizontal: spacing[4],
    minWidth: 80,
  },
  unitPickerText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  unitPickerDropdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  unitOption: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgLight,
  },
  unitOptionActive: {
    backgroundColor: colors.primary,
  },
  unitOptionText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  unitOptionTextActive: {
    color: colors.white,
  },
});
