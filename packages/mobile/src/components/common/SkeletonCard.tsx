import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from './Skeleton';
import SkeletonThumbnail from './SkeletonThumbnail';
import { colors, spacing, borderRadius } from '../../theme';

type SkeletonCardVariant = 'attempt' | 'item' | 'starred' | 'featured';

interface SkeletonCardProps {
  variant: SkeletonCardVariant;
}

export default function SkeletonCard({ variant }: SkeletonCardProps) {
  switch (variant) {
    case 'featured':
      return <FeaturedSkeletonCard />;
    case 'attempt':
      return <AttemptSkeletonCard />;
    case 'item':
      return <ItemSkeletonCard />;
    case 'starred':
      return <StarredSkeletonCard />;
    default:
      return <AttemptSkeletonCard />;
  }
}

function FeaturedSkeletonCard() {
  return (
    <View style={styles.featuredCard}>
      <SkeletonThumbnail size="featured" borderRadius={borderRadius.lg} style={styles.featuredThumbnail} />
      <View style={styles.featuredInfo}>
        <Skeleton width="70%" height={18} />
        <View style={styles.featuredMeta}>
          <Skeleton width={60} height={22} borderRadius={borderRadius.full} />
          <Skeleton width={80} height={14} />
        </View>
      </View>
    </View>
  );
}

function AttemptSkeletonCard() {
  return (
    <View style={styles.attemptCard}>
      <View style={styles.attemptHeader}>
        <Skeleton width={80} height={14} />
        <Skeleton width={60} height={22} borderRadius={borderRadius.full} />
      </View>
      <Skeleton width="80%" height={18} style={styles.attemptName} />
      <Skeleton width="60%" height={14} />
    </View>
  );
}

function ItemSkeletonCard() {
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemContent}>
        <Skeleton width={40} height={40} borderRadius={borderRadius.lg} />
        <View style={styles.itemInfo}>
          <Skeleton width="70%" height={16} />
          <Skeleton width="50%" height={12} style={styles.itemNotes} />
        </View>
      </View>
      <Skeleton width={24} height={24} />
    </View>
  );
}

function StarredSkeletonCard() {
  return (
    <View style={styles.starredCard}>
      <View style={styles.starredContent}>
        <SkeletonThumbnail size="sm" />
        <View style={styles.starredInfo}>
          <Skeleton width="70%" height={16} />
          <View style={styles.starredMeta}>
            <Skeleton width={70} height={20} borderRadius={borderRadius.full} />
            <Skeleton width={80} height={12} />
          </View>
        </View>
        <Skeleton width={24} height={24} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Featured card (for carousel)
  featuredCard: {
    width: 256,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[3],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  featuredThumbnail: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  featuredInfo: {
    marginTop: spacing[3],
    gap: spacing[1],
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  // Attempt card (timeline)
  attemptCard: {
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  attemptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  attemptName: {
    marginBottom: spacing[2],
  },

  // Item card (pantry)
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    minHeight: 64,
    borderRadius: borderRadius.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  itemInfo: {
    flex: 1,
    gap: spacing[1],
  },
  itemNotes: {
    marginTop: spacing[0.5],
  },

  // Starred card
  starredCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    padding: spacing[4],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  starredContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  starredInfo: {
    flex: 1,
    gap: spacing[2],
  },
  starredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
});
