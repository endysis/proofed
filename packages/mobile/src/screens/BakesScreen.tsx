import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAttempts } from '../hooks/useAttempts';
import { Loading, Icon } from '../components/common';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../theme';
import type { Attempt } from '@proofed/shared';

export default function BakesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: attempts, isLoading, error } = useAttempts();

  if (isLoading) return <Loading />;
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Error loading attempts</Text>
      </View>
    );
  }

  const sortedAttempts = [...(attempts || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Bake Log</Text>
          <Text style={styles.subtitle}>Your baking experiments</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('NewAttempt')}
        >
          <Icon name="add" color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sortedAttempts.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <Icon name="menu_book" size="xl" color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No bakes yet</Text>
            <Text style={styles.emptyDescription}>
              Start logging your experiments
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('NewAttempt')}>
              <Text style={styles.emptyLink}>Log Your First Bake</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.timeline}>
            {/* Timeline line */}
            <View style={styles.timelineLine} />

            {sortedAttempts.map((attempt, index) => (
              <TouchableOpacity
                key={attempt.attemptId}
                style={styles.timelineItem}
                onPress={() =>
                  navigation.navigate('AttemptDetail', {
                    attemptId: attempt.attemptId,
                  })
                }
                activeOpacity={0.8}
              >
                {/* Timeline dot */}
                <View
                  style={[
                    styles.timelineDot,
                    index === 0 ? styles.timelineDotActive : null,
                  ]}
                />

                <View
                  style={[
                    styles.attemptCard,
                    index !== 0 && styles.attemptCardFaded,
                  ]}
                >
                  <View style={styles.attemptHeader}>
                    <Text style={styles.attemptDate}>
                      {new Date(attempt.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                    {attempt.itemUsages && attempt.itemUsages.length > 0 && (
                      <View style={styles.itemsBadge}>
                        <Text style={styles.itemsBadgeText}>
                          {attempt.itemUsages.length} items
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.attemptName}>{attempt.name}</Text>
                  {attempt.notes && (
                    <Text style={styles.attemptNotes} numberOfLines={2}>
                      {attempt.notes}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 96 + insets.bottom }]}
        onPress={() => navigation.navigate('NewAttempt')}
        activeOpacity={0.8}
      >
        <Icon name="add" size="lg" color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.error,
    padding: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    paddingBottom: spacing[2],
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[20],
  },
  emptyCard: {
    marginTop: spacing[4],
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    padding: spacing[8],
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
    marginBottom: spacing[1],
  },
  emptyDescription: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    marginBottom: spacing[4],
  },
  emptyLink: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  timeline: {
    marginTop: spacing[4],
    position: 'relative',
    gap: spacing[4],
  },
  timelineLine: {
    position: 'absolute',
    left: 7,
    top: 16,
    bottom: 16,
    width: 2,
    backgroundColor: 'rgba(244, 172, 183, 0.5)',
  },
  timelineItem: {
    flexDirection: 'row',
    paddingLeft: spacing[8],
  },
  timelineDot: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.dustyMauve,
    borderWidth: 2,
    borderColor: colors.white,
    zIndex: 1,
  },
  timelineDotActive: {
    backgroundColor: colors.primary,
  },
  attemptCard: {
    flex: 1,
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
  attemptCardFaded: {
    opacity: 0.8,
  },
  attemptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[1],
  },
  attemptDate: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    textTransform: 'uppercase',
  },
  itemsBadge: {
    backgroundColor: '#f4f0f1',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.full,
  },
  itemsBadgeText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
  },
  attemptName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
    marginBottom: spacing[1],
  },
  attemptNotes: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  fab: {
    position: 'absolute',
    right: spacing[4],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.dustyMauve,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
