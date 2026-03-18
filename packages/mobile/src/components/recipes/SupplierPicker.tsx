import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Icon, Modal } from '../common';
import SupplierFavicon from '../common/SupplierFavicon';
import { SUPPLIERS } from '../../constants/suppliers';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../../theme';

interface CustomSource {
  name: string;
  url?: string;
}

interface SupplierPickerProps {
  value?: string | null;
  customSource?: CustomSource | null;
  customSources?: CustomSource[];
  onChange: (supplierId: string | null, customSource?: CustomSource | null) => void;
}

export default function SupplierPicker({ value, customSource, customSources, onChange }: SupplierPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  const selectedSupplier = value ? SUPPLIERS.find((s) => s.id === value) : null;

  const handleSelect = (supplierId: string | null) => {
    onChange(supplierId, null);
    setShowPicker(false);
  };

  const handleAddCustom = () => {
    setShowPicker(false);
    setCustomName(customSource?.name || '');
    setCustomUrl(customSource?.url || '');
    setShowCustomModal(true);
  };

  const handleSaveCustom = () => {
    if (customName.trim()) {
      onChange(null, {
        name: customName.trim(),
        url: customUrl.trim() || undefined,
      });
    }
    setShowCustomModal(false);
    setCustomName('');
    setCustomUrl('');
  };

  const handleCancelCustom = () => {
    setShowCustomModal(false);
    setCustomName('');
    setCustomUrl('');
  };

  // Display logic: show custom source if set, otherwise show selected supplier
  const displayCustomSource = !value && customSource?.name;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setShowPicker(!showPicker)}
      >
        {displayCustomSource ? (
          <View style={styles.selectedRow}>
            <SupplierFavicon customUrl={customSource?.url} size={20} />
            <Text style={styles.selectedText}>{customSource?.name}</Text>
          </View>
        ) : selectedSupplier ? (
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
              style={[styles.option, !value && !customSource && styles.optionActive]}
              onPress={() => handleSelect(null)}
            >
              <Text style={[styles.optionText, !value && !customSource && styles.optionTextActive]}>
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
            {customSources && customSources.filter(
              (s) => s.name !== customSource?.name
            ).length > 0 && (
              <>
                <View style={styles.sectionDivider}>
                  <Text style={styles.sectionLabel}>Previously Used</Text>
                </View>
                {customSources
                  .filter((s) => s.name !== customSource?.name)
                  .map((source) => (
                    <TouchableOpacity
                      key={source.name}
                      style={styles.option}
                      onPress={() => {
                        onChange(null, { name: source.name, url: source.url });
                        setShowPicker(false);
                      }}
                    >
                      <SupplierFavicon customUrl={source.url} size={18} />
                      <Text style={styles.optionText}>{source.name}</Text>
                    </TouchableOpacity>
                  ))}
              </>
            )}
            <TouchableOpacity
              style={[styles.option, styles.addCustomOption]}
              onPress={handleAddCustom}
            >
              <Icon name="add" size="sm" color={colors.primary} />
              <Text style={styles.addCustomText}>Add custom source</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Custom Source Modal */}
      <Modal
        isOpen={showCustomModal}
        onClose={handleCancelCustom}
        title="Add Custom Source"
      >
        <View style={styles.modalContent}>
          <View style={styles.modalField}>
            <Text style={styles.modalLabel}>Source Name</Text>
            <TextInput
              style={styles.modalInput}
              value={customName}
              onChangeText={setCustomName}
              placeholder="e.g., BBC Good Food"
              placeholderTextColor={colors.dustyMauve}
              autoFocus
            />
          </View>
          <View style={styles.modalField}>
            <Text style={styles.modalLabel}>
              Website <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.modalInput}
              value={customUrl}
              onChangeText={setCustomUrl}
              placeholder="e.g., bbcgoodfood.com"
              placeholderTextColor={colors.dustyMauve}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={styles.modalHint}>
              Enter the website domain to show its icon
            </Text>
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={handleCancelCustom}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSaveButton, !customName.trim() && styles.buttonDisabled]}
              onPress={handleSaveCustom}
              disabled={!customName.trim()}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    maxHeight: 250,
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
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    marginTop: spacing[1],
    paddingTop: spacing[2],
    paddingHorizontal: spacing[4],
  },
  sectionLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addCustomOption: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    marginTop: spacing[1],
  },
  addCustomText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.primary,
  },
  // Modal styles
  modalContent: {
    paddingTop: spacing[2],
  },
  modalField: {
    marginBottom: spacing[4],
  },
  modalLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing[2],
  },
  optional: {
    fontFamily: fontFamily.regular,
    color: colors.dustyMauve,
  },
  modalInput: {
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
  modalHint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    marginTop: spacing[1],
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalSaveText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.white,
  },
});
