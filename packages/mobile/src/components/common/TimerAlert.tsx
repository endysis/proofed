import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from './Modal';
import Icon from './Icon';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../../theme';

interface TimerAlertProps {
  isVisible: boolean;
  type: 'completion' | 'halfway';
  itemName: string;
  onDismiss: () => void;
}

const alertConfig = {
  completion: {
    icon: 'check_circle' as const,
    title: 'Timer Complete!',
    color: colors.success,
    message: (name: string) => `${name} is ready to check.`,
  },
  halfway: {
    icon: 'timer' as const,
    title: 'Halfway There!',
    color: colors.primary,
    message: (name: string) => `${name} is at the halfway point.`,
  },
};

export default function TimerAlert({ isVisible, type, itemName, onDismiss }: TimerAlertProps) {
  const config = alertConfig[type];

  return (
    <Modal isOpen={isVisible} onClose={onDismiss} title={config.title}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: `${config.color}20` }]}>
          <Icon name={config.icon} size="xl" color={config.color} />
        </View>
        <Text style={styles.message}>{config.message(itemName)}</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: config.color }]}
          onPress={onDismiss}
        >
          <Text style={styles.buttonText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  message: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  button: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[8],
    borderRadius: borderRadius.xl,
  },
  buttonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.white,
  },
});
