import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { borderRadius, spacing, fontFamily, fontSize } from '../../theme';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  style?: ViewStyle;
}

const variants = {
  default: {
    container: { backgroundColor: '#f3f4f6' },
    text: { color: '#374151' },
  },
  primary: {
    container: { backgroundColor: '#fef3c7' },
    text: { color: '#92400e' },
  },
  success: {
    container: { backgroundColor: '#dcfce7' },
    text: { color: '#166534' },
  },
  warning: {
    container: { backgroundColor: '#fef9c3' },
    text: { color: '#854d0e' },
  },
};

export default function Badge({ children, variant = 'default', style }: BadgeProps) {
  return (
    <View style={[styles.container, variants[variant].container, style]}>
      {typeof children === 'string' ? (
        <Text style={[styles.text, variants[variant].text]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.full,
  },
  text: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
});
