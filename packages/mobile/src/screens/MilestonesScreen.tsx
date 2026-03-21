import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Icon, Skeleton } from '../components/common';
import { ProfileHero, BadgeGrid, MilestoneFeed } from '../components/milestones';
import { useMilestones } from '../hooks/useMilestones';
import { usePreferences } from '../contexts/PreferencesContext';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../theme';

export default function MilestonesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const milestones = useMilestones();
  const { preferences, updatePreferences } = usePreferences();

  // Mark earned badges as seen on mount
  const seenBadgeIds = preferences?.seenBadgeIds || [];
  const earnedBadgeIds = milestones.earnedBadges.map((eb) => eb.badge.id);

  // Compute which badges are new (earned but not yet seen)
  const earnedBadgesWithNew = milestones.earnedBadges.map((eb) => ({
    ...eb,
    isNew: !seenBadgeIds.includes(eb.badge.id),
  }));

  const hasNewBadges = earnedBadgesWithNew.some((eb) => eb.isNew);

  // Mark all earned badges as seen when leaving the screen
  const markBadgesSeen = useCallback(() => {
    if (hasNewBadges && earnedBadgeIds.length > 0) {
      updatePreferences({ seenBadgeIds: earnedBadgeIds });
    }
  }, [hasNewBadges, earnedBadgeIds, updatePreferences]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      markBadgesSeen();
    });
    return unsubscribe;
  }, [navigation, markBadgesSeen]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow_back" size="md" color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Milestones</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing[6] }}
        showsVerticalScrollIndicator={false}
      >
        {milestones.isLoading ? (
          <MilestonesSkeleton />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Your Baker Class</Text>
              <ProfileHero
                currentLevel={milestones.currentLevel}
                totalNibs={milestones.totalNibs}
                nibsToNextLevel={milestones.nibsToNextLevel}
                levelProgress={milestones.levelProgress}
              />
            </View>

            <View style={styles.section}>
              <BadgeGrid earnedBadges={earnedBadgesWithNew} />
            </View>

            <View style={styles.section}>
              <MilestoneFeed events={milestones.recentMilestones} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function MilestonesSkeleton() {
  return (
    <>
      {/* Profile Hero Skeleton */}
      <View style={styles.section}>
        <View style={styles.skeletonCard}>
          <View style={{ alignItems: 'center' }}>
            <Skeleton width={88} height={88} borderRadius={44} />
            <Skeleton width={120} height={20} style={{ marginTop: spacing[3] }} />
            <Skeleton width={80} height={14} style={{ marginTop: spacing[2] }} />
            <Skeleton width="80%" height={8} style={{ marginTop: spacing[3] }} />
          </View>
        </View>
      </View>


{/* Badge Grid Skeleton */}
      <View style={styles.section}>
        <View style={{ paddingHorizontal: spacing[4] }}>
          <Skeleton width={120} height={20} />
          <View style={{ flexDirection: 'row', gap: spacing[3], marginTop: spacing[3] }}>
            <Skeleton width={100} height={100} borderRadius={borderRadius.xl} />
            <Skeleton width={100} height={100} borderRadius={borderRadius.xl} />
            <Skeleton width={100} height={100} borderRadius={borderRadius.xl} />
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  backButton: {
    padding: spacing[2],
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: spacing[5],
  },
  sectionLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text,
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
skeletonCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
});
