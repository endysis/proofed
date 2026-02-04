import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../../theme';

interface TextAreaProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export default function TextArea({
  label,
  error,
  containerStyle,
  style,
  ...props
}: TextAreaProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.dustyMauve}
        multiline
        textAlignVertical="top"
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
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
  input: {
    width: '100%',
    minHeight: 100,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: '#e5e7eb', // gray-200
    borderRadius: borderRadius.xl,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: '#ef4444', // red-500
  },
  error: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: '#ef4444', // red-500
  },
});
