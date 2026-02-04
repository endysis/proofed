import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleProp, TextStyle } from 'react-native';
import { colors } from '../../theme';

// Map Material Symbols names to MaterialIcons names (they differ slightly)
const iconNameMap: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  home: 'home',
  restaurant_menu: 'restaurant-menu',
  bakery_dining: 'bakery-dining',
  verified: 'verified',
  arrow_back_ios: 'arrow-back-ios',
  add: 'add',
  edit: 'edit',
  delete: 'delete',
  close: 'close',
  check: 'check',
  timer: 'timer',
  thermostat: 'thermostat',
  science: 'science',
  photo_camera: 'photo-camera',
  image: 'image',
  chevron_right: 'chevron-right',
  expand_more: 'expand-more',
  expand_less: 'expand-less',
  calendar_today: 'calendar-today',
  schedule: 'schedule',
  info: 'info',
  warning: 'warning',
  error: 'error',
  search: 'search',
  more_vert: 'more-vert',
  content_copy: 'content-copy',
  notes: 'notes',
  category: 'category',
  straighten: 'straighten',
  scale: 'scale',
  star: 'star',
  star_outline: 'star-outline',
  favorite: 'favorite',
  favorite_border: 'favorite-border',
};

interface IconProps {
  name: string;
  filled?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: StyleProp<TextStyle>;
}

const sizes = {
  sm: 16,
  md: 24,
  lg: 28,
  xl: 32,
};

export default function Icon({
  name,
  filled,
  color = colors.text,
  size = 'md',
  style,
}: IconProps) {
  // Convert name to MaterialIcons format (replace underscores with hyphens if not in map)
  const iconName = iconNameMap[name] || (name.replace(/_/g, '-') as keyof typeof MaterialIcons.glyphMap);

  return (
    <MaterialIcons
      name={iconName}
      size={sizes[size]}
      color={color}
      style={style}
    />
  );
}
