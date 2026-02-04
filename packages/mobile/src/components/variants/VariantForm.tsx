import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Icon, Modal } from '../common';
import { UNIT_PRESETS } from '../../constants/units';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../../theme';
import type { Variant, Ingredient, CreateVariantRequest } from '@proofed/shared';

interface VariantFormProps {
  variant?: Variant;
  recipeIngredients?: Ingredient[];
  onSubmit: (data: CreateVariantRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function VariantForm({
  variant,
  recipeIngredients = [],
  onSubmit,
  onCancel,
  isLoading,
}: VariantFormProps) {
  const [name, setName] = useState(variant?.name || '');
  const [ingredientOverrides, setIngredientOverrides] = useState<Ingredient[]>(
    variant?.ingredientOverrides || [{ name: '', quantity: 0, unit: '' }]
  );
  const [bakeTime, setBakeTime] = useState<string>(variant?.bakeTime?.toString() ?? '');
  const [bakeTemp, setBakeTemp] = useState<string>(variant?.bakeTemp?.toString() ?? '');
  const [bakeTempUnit, setBakeTempUnit] = useState<'F' | 'C'>(variant?.bakeTempUnit ?? 'F');
  const [notes, setNotes] = useState(variant?.notes || '');
  const [ingredientPickerIndex, setIngredientPickerIndex] = useState<number | null>(null);

  const handleIngredientSelect = (index: number, ingredientName: string) => {
    const recipeIngredient = recipeIngredients.find((i) => i.name === ingredientName);
    if (recipeIngredient) {
      const updated = [...ingredientOverrides];
      updated[index] = { ...recipeIngredient };
      setIngredientOverrides(updated);
    }
    setIngredientPickerIndex(null);
  };

  const handleSubmit = () => {
    const validOverrides = ingredientOverrides.filter((i) => i.name.trim());
    onSubmit({
      name,
      ingredientOverrides: validOverrides,
      bakeTime: bakeTime ? parseInt(bakeTime) : undefined,
      bakeTemp: bakeTemp ? parseInt(bakeTemp) : undefined,
      bakeTempUnit: bakeTemp ? bakeTempUnit : undefined,
      notes: notes || undefined,
    });
  };

  const updateOverride = (index: number, field: keyof Ingredient, value: string | number) => {
    const updated = [...ingredientOverrides];
    updated[index] = { ...updated[index], [field]: value };
    setIngredientOverrides(updated);
  };

  const addOverride = () => {
    setIngredientOverrides([...ingredientOverrides, { name: '', quantity: 0, unit: '' }]);
  };

  const removeOverride = (index: number) => {
    if (ingredientOverrides.length > 1) {
      setIngredientOverrides(ingredientOverrides.filter((_, i) => i !== index));
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.field}>
        <Text style={styles.label}>Variant Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., +15% Oil Version"
          placeholderTextColor={colors.dustyMauve}
          autoFocus
        />
      </View>

      <View style={styles.field}>
        <View>
          <Text style={styles.label}>Ingredient Overrides</Text>
          <Text style={styles.hint}>Only list ingredients that are different</Text>
        </View>

        {ingredientOverrides.map((override, index) => (
          <View key={index} style={styles.overrideCard}>
            <View style={styles.overrideHeader}>
              {recipeIngredients.length > 0 ? (
                <TouchableOpacity
                  style={styles.ingredientPicker}
                  onPress={() => setIngredientPickerIndex(index)}
                >
                  <Text
                    style={[
                      styles.ingredientPickerText,
                      !override.name && styles.placeholder,
                    ]}
                    numberOfLines={1}
                  >
                    {override.name || 'Select ingredient...'}
                  </Text>
                  <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
                </TouchableOpacity>
              ) : (
                <TextInput
                  style={[styles.input, styles.nameInput]}
                  value={override.name}
                  onChangeText={(text) => updateOverride(index, 'name', text)}
                  placeholder="Ingredient"
                  placeholderTextColor={colors.dustyMauve}
                />
              )}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeOverride(index)}
              >
                <Icon name="close" size="sm" color={colors.dustyMauve} />
              </TouchableOpacity>
            </View>

            {override.name && (
              <View style={styles.overrideValues}>
                <Text style={styles.overrideName} numberOfLines={1}>
                  {override.name}
                </Text>
                <TextInput
                  style={[styles.input, styles.qtyInput]}
                  value={override.quantity ? String(override.quantity) : ''}
                  onChangeText={(text) =>
                    updateOverride(index, 'quantity', parseFloat(text) || 0)
                  }
                  placeholder="Qty"
                  placeholderTextColor={colors.dustyMauve}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[styles.input, styles.unitInput]}
                  value={override.unit}
                  onChangeText={(text) => updateOverride(index, 'unit', text)}
                  placeholder="Unit"
                  placeholderTextColor={colors.dustyMauve}
                />
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={styles.addButton}
          onPress={addOverride}
          activeOpacity={0.7}
        >
          <Icon name="add" size="sm" color={colors.primary} />
          <Text style={styles.addButtonText}>Add Override</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          Bake Settings Override <Text style={styles.optional}>(optional)</Text>
        </Text>
        <View style={styles.bakeSettingsRow}>
          <View style={styles.bakeField}>
            <Text style={styles.subLabel}>Time (min)</Text>
            <TextInput
              style={styles.input}
              value={bakeTime}
              onChangeText={setBakeTime}
              placeholder="Override"
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
              placeholder="Override"
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
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="What's different and why"
          placeholderTextColor={colors.dustyMauve}
          multiline
          numberOfLines={3}
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
            {variant ? 'Update' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Ingredient Picker Modal */}
      <Modal
        isOpen={ingredientPickerIndex !== null}
        onClose={() => setIngredientPickerIndex(null)}
        title="Select Ingredient"
      >
        <ScrollView style={styles.pickerList}>
          {recipeIngredients.map((ing) => (
            <TouchableOpacity
              key={ing.name}
              style={styles.pickerOption}
              onPress={() => handleIngredientSelect(ingredientPickerIndex!, ing.name)}
            >
              <Text style={styles.pickerOptionName}>{ing.name}</Text>
              <Text style={styles.pickerOptionValue}>
                {ing.quantity} {ing.unit}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>
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
    marginTop: -spacing[1],
    marginBottom: spacing[3],
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
    height: 80,
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    textAlignVertical: 'top',
  },
  overrideCard: {
    marginBottom: spacing[2],
  },
  overrideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  ingredientPicker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.xl,
    height: 44,
    paddingHorizontal: spacing[3],
  },
  ingredientPickerText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  placeholder: {
    color: colors.dustyMauve,
  },
  nameInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.bgLight,
  },
  removeButton: {
    padding: spacing[2],
  },
  overrideValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
    paddingLeft: spacing[2],
  },
  overrideName: {
    width: 60,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
  },
  qtyInput: {
    width: 60,
    height: 40,
    backgroundColor: colors.bgLight,
    textAlign: 'center',
    paddingHorizontal: spacing[2],
  },
  unitInput: {
    width: 70,
    height: 40,
    backgroundColor: colors.bgLight,
    textAlign: 'center',
    paddingHorizontal: spacing[2],
  },
  addButton: {
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
  pickerList: {
    maxHeight: 300,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  pickerOptionName: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.text,
  },
  pickerOptionValue: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
});
