import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Icon, Skeleton } from '../components/common';
import {
  SummaryCards,
  BakeActivityChart,
  CategoryBreakdown,
  TopRecipes,
} from '../components/analytics';
import { useAnalytics } from '../hooks/useAnalytics';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../theme';

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const analytics = useAnalytics();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow_back" size="md" color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing[6] }}
        showsVerticalScrollIndicator={false}
      >
        {analytics.isLoading ? (
          <AnalyticsSkeleton />
        ) : (
          <>
            <View style={styles.section}>
              <SummaryCards
                totalBakes={analytics.totalBakes}
                currentStreak={analytics.currentStreak}
                averageRating={analytics.averageRating}
              />
            </View>

            <View style={styles.section}>
              <BakeActivityChart data={analytics.monthlyActivity} />
            </View>

            <View style={styles.section}>
              <CategoryBreakdown data={analytics.categoryBreakdown} />
            </View>

            <View style={styles.section}>
              <TopRecipes data={analytics.topRecipes} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function AnalyticsSkeleton() {
  return (
    <>
      {/* Summary Cards Skeleton */}
      <View style={styles.section}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.skeletonCards}
        >
          <Skeleton width={100} height={80} borderRadius={borderRadius.xl} />
          <Skeleton width={100} height={80} borderRadius={borderRadius.xl} />
          <Skeleton width={100} height={80} borderRadius={borderRadius.xl} />
        </ScrollView>
      </View>

      {/* Chart Skeleton */}
      <View style={styles.section}>
        <View style={styles.skeletonCard}>
          <Skeleton width={120} height={18} />
          <Skeleton width={80} height={14} style={{ marginTop: spacing[1] }} />
          <Skeleton width="100%" height={150} style={{ marginTop: spacing[4] }} />
        </View>
      </View>

      {/* Breakdown Skeleton */}
      <View style={styles.section}>
        <View style={styles.skeletonCard}>
          <Skeleton width={120} height={18} />
          <View style={styles.skeletonBreakdown}>
            <Skeleton width={140} height={140} borderRadius={70} />
            <View style={styles.skeletonLegend}>
              <Skeleton width="100%" height={16} />
              <Skeleton width="80%" height={16} />
              <Skeleton width="90%" height={16} />
            </View>
          </View>
        </View>
      </View>

      {/* Top Recipes Skeleton */}
      <View style={styles.section}>
        <View style={styles.skeletonCard}>
          <Skeleton width={100} height={18} />
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={28} height={18} />
              <Skeleton width={44} height={44} borderRadius={borderRadius.lg} />
              <View style={{ flex: 1 }}>
                <Skeleton width="70%" height={14} />
                <Skeleton width="50%" height={12} style={{ marginTop: spacing[1] }} />
              </View>
              <Skeleton width={32} height={18} />
            </View>
          ))}
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
  skeletonCards: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  skeletonCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  skeletonBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[4],
  },
  skeletonLegend: {
    flex: 1,
    marginLeft: spacing[4],
    gap: spacing[2],
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    marginTop: spacing[2],
  },
});
