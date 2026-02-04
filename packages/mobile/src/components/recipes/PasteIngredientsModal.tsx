import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Modal, Icon } from '../common';
import { parseIngredients, ParsedIngredient } from '../../utils/ingredientParser';
import { UNIT_PRESETS } from '../../constants/units';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../../theme';
import type { Ingredient } from '@proofed/shared';

interface PasteIngredientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (ingredients: Ingredient[]) => void;
}

export default function PasteIngredientsModal({
  isOpen,
  onClose,
  onAdd,
}: PasteIngredientsModalProps) {
  const [rawText, setRawText] = useState('');
  const [parsedIngredients, setParsedIngredients] = useState<ParsedIngredient[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleParse = () => {
    const parsed = parseIngredients(rawText);
    setParsedIngredients(parsed);
    setShowPreview(true);
  };

  const handleAdd = () => {
    const ingredients: Ingredient[] = parsedIngredients.map((p) => ({
      name: p.name,
      quantity: p.quantity,
      unit: p.unit,
    }));
    onAdd(ingredients);
    handleClose();
  };

  const handleClose = () => {
    setRawText('');
    setParsedIngredients([]);
    setShowPreview(false);
    onClose();
  };

  const updateParsedIngredient = (
    index: number,
    field: keyof ParsedIngredient,
    value: string | number
  ) => {
    setParsedIngredients((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeParsedIngredient = (index: number) => {
    setParsedIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const isPresetUnit = (unit: string) => UNIT_PRESETS.some((p) => p.value === unit);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Paste Ingredients">
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!showPreview ? (
          <>
            <Text style={styles.helpText}>
              Paste your ingredient list below, one ingredient per line.
            </Text>
            <TextInput
              style={styles.textArea}
              value={rawText}
              onChangeText={setRawText}
              placeholder={`Example:
600g Self Raising Flour
1/4 tsp Sea Salt
180g Buttermilk
1.5tsp Vanilla Extract
9 Large Eggs
420g Unsalted Butter, Softened`}
              placeholderTextColor={colors.dustyMauve}
              multiline
              numberOfLines={10}
              textAlignVertical="top"
              autoFocus
            />
          </>
        ) : (
          <>
            <Text style={styles.helpText}>
              Review and edit the parsed ingredients below.
            </Text>
            {parsedIngredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientCard}>
                <Text style={styles.originalLine} numberOfLines={1}>
                  {ingredient.originalLine}
                </Text>
                <View style={styles.ingredientRow}>
                  <TextInput
                    style={[styles.input, styles.nameInput]}
                    value={ingredient.name}
                    onChangeText={(text) => updateParsedIngredient(index, 'name', text)}
                    placeholder="Ingredient"
                    placeholderTextColor={colors.dustyMauve}
                  />
                  <TextInput
                    style={[styles.input, styles.qtyInput]}
                    value={ingredient.quantity ? String(ingredient.quantity) : ''}
                    onChangeText={(text) =>
                      updateParsedIngredient(index, 'quantity', parseFloat(text) || 0)
                    }
                    placeholder="Qty"
                    placeholderTextColor={colors.dustyMauve}
                    keyboardType="decimal-pad"
                  />
                  <TextInput
                    style={[styles.input, styles.unitInput]}
                    value={ingredient.unit}
                    onChangeText={(text) => updateParsedIngredient(index, 'unit', text)}
                    placeholder="Unit"
                    placeholderTextColor={colors.dustyMauve}
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeParsedIngredient(index)}
                  >
                    <Icon name="close" size="sm" color={colors.dustyMauve} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {parsedIngredients.length === 0 && (
              <Text style={styles.emptyText}>
                No ingredients could be parsed. Try a different format.
              </Text>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.buttons}>
        {!showPreview ? (
          <>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                !rawText.trim() && styles.buttonDisabled,
              ]}
              onPress={handleParse}
              disabled={!rawText.trim()}
              activeOpacity={0.7}
            >
              <Text style={styles.submitButtonText}>Parse</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPreview(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                parsedIngredients.length === 0 && styles.buttonDisabled,
              ]}
              onPress={handleAdd}
              disabled={parsedIngredients.length === 0}
              activeOpacity={0.7}
            >
              <Text style={styles.submitButtonText}>
                Add {parsedIngredients.length} Ingredient{parsedIngredients.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    marginBottom: spacing[4],
  },
  helpText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    marginBottom: spacing[3],
  },
  textArea: {
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text,
    minHeight: 200,
  },
  ingredientCard: {
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.xl,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  originalLine: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    marginBottom: spacing[2],
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.lg,
    height: 40,
    paddingHorizontal: spacing[3],
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  nameInput: {
    flex: 1,
  },
  qtyInput: {
    width: 60,
    textAlign: 'center',
  },
  unitInput: {
    width: 60,
    textAlign: 'center',
  },
  removeButton: {
    padding: spacing[2],
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.dustyMauve,
    textAlign: 'center',
    paddingVertical: spacing[8],
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing[3],
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
