import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { colors, borderRadius, spacing, fontFamily, fontSize } from '../../theme';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  disabled,
  loading,
  onPress,
  children,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? colors.white : colors.text}
        />
      ) : typeof children === 'string' ? (
        <Text style={[styles.text, variantTextStyles[variant], sizeTextStyles[size]]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.xl,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: fontFamily.medium,
  },
});

const variantStyles: Record<string, ViewStyle> = {
  primary: {
    backgroundColor: '#d97706', // amber-600
  },
  secondary: {
    backgroundColor: '#f3f4f6', // gray-100
    borderWidth: 1,
    borderColor: '#e5e7eb', // gray-200
  },
  danger: {
    backgroundColor: '#dc2626', // red-600
  },
  ghost: {
    backgroundColor: 'transparent',
  },
};

const variantTextStyles: Record<string, TextStyle> = {
  primary: {
    color: colors.white,
  },
  secondary: {
    color: '#374151', // gray-700
  },
  danger: {
    color: colors.white,
  },
  ghost: {
    color: '#4b5563', // gray-600
  },
};

const sizeStyles: Record<string, ViewStyle> = {
  sm: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    minHeight: 36,
  },
  md: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    minHeight: 44,
  },
  lg: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    minHeight: 48,
  },
};

const sizeTextStyles: Record<string, TextStyle> = {
  sm: {
    fontSize: fontSize.sm,
  },
  md: {
    fontSize: fontSize.sm,
  },
  lg: {
    fontSize: fontSize.base,
  },
};
