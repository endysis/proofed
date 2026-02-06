import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Icon from './Icon';
import { colors, spacing } from '../../theme';

interface FavoriteButtonProps {
  isStarred: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function FavoriteButton({ isStarred, onToggle, disabled }: FavoriteButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle();
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Icon
        name={isStarred ? 'favorite' : 'favorite_border'}
        size="md"
        color={isStarred ? colors.primary : colors.dustyMauve}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: spacing[1],
  },
});
