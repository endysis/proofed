import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Icon } from '../common';
import SupplierFavicon from '../common/SupplierFavicon';
import { SUPPLIERS } from '../../constants/suppliers';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../../theme';

interface SupplierPickerProps {
  value?: string | null;
  onChange: (supplierId: string | null) => void;
}

export default function SupplierPicker({ value, onChange }: SupplierPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const selectedSupplier = value ? SUPPLIERS.find((s) => s.id === value) : null;

  const handleSelect = (supplierId: string | null) => {
    onChange(supplierId);
    setShowPicker(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setShowPicker(!showPicker)}
      >
        {selectedSupplier ? (
          <View style={styles.selectedRow}>
            <SupplierFavicon supplierId={selectedSupplier.id} size={20} />
            <Text style={styles.selectedText}>{selectedSupplier.name}</Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>Select a source</Text>
        )}
        <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
      </TouchableOpacity>

      {showPicker && (
        <View style={styles.dropdown}>
          <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.option, !value && styles.optionActive]}
              onPress={() => handleSelect(null)}
            >
              <Text style={[styles.optionText, !value && styles.optionTextActive]}>
                None
              </Text>
            </TouchableOpacity>
            {SUPPLIERS.map((supplier) => (
              <TouchableOpacity
                key={supplier.id}
                style={[styles.option, value === supplier.id && styles.optionActive]}
                onPress={() => handleSelect(supplier.id)}
              >
                <SupplierFavicon supplierId={supplier.id} size={18} />
                <Text
                  style={[
                    styles.optionText,
                    value === supplier.id && styles.optionTextActive,
                  ]}
                >
                  {supplier.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 200,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: colors.white,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  selectedText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  placeholderText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.dustyMauve,
  },
  dropdown: {
    position: 'absolute',
    top: 56,
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
    maxHeight: 200,
  },
  dropdownScroll: {
    paddingVertical: spacing[1],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  optionActive: {
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
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
