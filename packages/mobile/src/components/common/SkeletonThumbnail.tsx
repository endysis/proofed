import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Skeleton from './Skeleton';
import { borderRadius as themeBorderRadius } from '../../theme';

type ThumbnailSize = 'sm' | 'md' | 'lg' | 'featured';

interface SkeletonThumbnailProps {
  size: ThumbnailSize;
  borderRadius?: number;
  style?: ViewStyle;
}

const sizeMap: Record<ThumbnailSize, { width: number; height: number }> = {
  sm: { width: 48, height: 48 },
  md: { width: 80, height: 80 },
  lg: { width: 120, height: 90 },
  featured: { width: 0, height: 0 }, // Not used, featured uses aspectRatio
};

export default function SkeletonThumbnail({
  size,
  borderRadius = themeBorderRadius.lg,
  style,
}: SkeletonThumbnailProps) {
  const dimensions = sizeMap[size];

  if (size === 'featured') {
    return (
      <Skeleton
        width="100%"
        height={0}
        borderRadius={borderRadius}
        style={StyleSheet.flatten([{ aspectRatio: 4 / 3 }, style])}
      />
    );
  }

  return (
    <Skeleton
      width={dimensions.width}
      height={dimensions.height}
      borderRadius={borderRadius}
      style={style}
    />
  );
}
