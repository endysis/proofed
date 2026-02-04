import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  FlatList,
} from 'react-native';
import Modal from './Modal';
import Icon from './Icon';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../../theme';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
}

export default function Select({
  label,
  error,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  containerStyle,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.trigger, error && styles.triggerError]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.triggerText, !selectedOption && styles.placeholder]}
          numberOfLines={1}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <Icon name="expand_more" color={colors.dustyMauve} size="md" />
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={label || 'Select'}
      >
        <FlatList
          data={options}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.option,
                item.value === value && styles.optionSelected,
              ]}
              onPress={() => handleSelect(item.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionText,
                  item.value === value && styles.optionTextSelected,
                ]}
              >
                {item.label}
              </Text>
              {item.value === value && (
                <Icon name="check" color={colors.primary} size="md" />
              )}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[1.5],
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: '#374151', // gray-700
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: '#e5e7eb', // gray-200
    borderRadius: borderRadius.xl,
    backgroundColor: colors.white,
  },
  triggerError: {
    borderColor: '#ef4444', // red-500
  },
  triggerText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  placeholder: {
    color: colors.dustyMauve,
  },
  error: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: '#ef4444', // red-500
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
  },
  optionSelected: {
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
  },
  optionText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  optionTextSelected: {
    fontFamily: fontFamily.medium,
    color: colors.primary,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
});
