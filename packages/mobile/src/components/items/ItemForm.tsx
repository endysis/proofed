import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Icon, Button } from '../common';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../../theme';
import type { Item, ItemType, CreateItemRequest } from '@proofed/shared';

const ITEM_TYPES: { value: ItemType; label: string; icon: string }[] = [
  { value: 'batter', label: 'Batter', icon: 'cake' },
  { value: 'frosting', label: 'Frosting', icon: 'water_drop' },
  { value: 'filling', label: 'Filling', icon: 'icecream' },
  { value: 'dough', label: 'Dough', icon: 'cookie' },
  { value: 'glaze', label: 'Glaze', icon: 'format_paint' },
  { value: 'other', label: 'Other', icon: 'category' },
];

interface ItemFormProps {
  item?: Item;
  onSubmit: (data: CreateItemRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ItemForm({
  item,
  onSubmit,
  onCancel,
  isLoading,
}: ItemFormProps) {
  const [name, setName] = useState(item?.name || '');
  const [type, setType] = useState<ItemType>(item?.type || 'batter');
  const [notes, setNotes] = useState(item?.notes || '');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name,
      type,
      notes: notes || undefined,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Vanilla Sponge"
          placeholderTextColor={colors.dustyMauve}
          autoFocus
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeGrid}>
          {ITEM_TYPES.map((itemType) => (
            <TouchableOpacity
              key={itemType.value}
              style={[
                styles.typeButton,
                type === itemType.value && styles.typeButtonActive,
              ]}
              onPress={() => setType(itemType.value)}
              activeOpacity={0.7}
            >
              <Icon
                name={itemType.icon}
                size="md"
                color={type === itemType.value ? colors.primary : colors.dustyMauve}
              />
              <Text
                style={[
                  styles.typeLabel,
                  type === itemType.value && styles.typeLabelActive,
                ]}
              >
                {itemType.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes or inspiration"
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
            (isLoading || !name.trim()) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isLoading || !name.trim()}
          activeOpacity={0.7}
        >
          <Text style={styles.submitButtonText}>
            {item ? 'Update' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[4],
  },
  field: {
    gap: spacing[2],
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
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
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  typeButton: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    gap: spacing[1],
  },
  typeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(229, 52, 78, 0.05)',
  },
  typeLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
  },
  typeLabelActive: {
    color: colors.primary,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingTop: spacing[2],
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
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.white,
  },
});
