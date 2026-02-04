import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontFamily, fontSize } from '../../theme';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
  title: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.lg,
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: '#6b7280', // gray-500
    marginTop: spacing[1],
    textAlign: 'center',
  },
  action: {
    marginTop: spacing[4],
  },
});
