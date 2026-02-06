import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../common';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../../theme';

interface LockedSectionProps {
  message: string;
}

export default function LockedSection({ message }: LockedSectionProps) {
  return (
    <View style={styles.container}>
      <Icon name="lock" size="lg" color={colors.dustyMauve} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[6],
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.pastelPink,
    backgroundColor: 'rgba(244, 172, 183, 0.1)',
    alignItems: 'center',
    gap: spacing[2],
  },
  text: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    textAlign: 'center',
  },
});
