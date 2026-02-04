import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  interactive?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function Card({ children, interactive, onPress, style }: CardProps) {
  if (interactive || onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    // Shadow for iOS
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    // Shadow for Android
    elevation: 1,
  },
});
