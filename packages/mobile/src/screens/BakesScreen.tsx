import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAttempts, useDeleteAttempt } from '../hooks/useAttempts';
import { Icon, SkeletonCard } from '../components/common';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../theme';
import type { Attempt, AttemptStatus } from '@proofed/shared';

const getStatusBadgeStyle = (status?: AttemptStatus) => {
  switch (status) {
    case 'planning':
      return { bg: '#FFF3CD', text: '#856404', dot: '#F59E0B' };
    case 'baking':
      return { bg: '#D4EDDA', text: '#155724', dot: '#10B981' };
    case 'done':
    default:
      return { bg: '#E2E3E5', text: '#6C757D', dot: colors.dustyMauve };
  }
};

const getStatusLabel = (status?: AttemptStatus) => {
  switch (status) {
    case 'planning':
      return 'Planning';
    case 'baking':
      return 'Baking';
    case 'done':
    default:
      return 'Done';
  }
};

export default function BakesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: attempts, isLoading, error } = useAttempts();
  const deleteAttempt = useDeleteAttempt();

  const handleDelete = (attemptId: string, attemptName: string) => {
    Alert.alert(
      'Delete Attempt',
      `Are you sure you want to delete "${attemptName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAttempt.mutate(attemptId),
        },
      ]
    );
  };

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Error loading attempts</Text>
      </View>
    );
  }

  // Upcoming bakes: ascending order (earliest first - shows what's next)
  const upcomingAttempts = [...(attempts || [])]
    .filter((a) => a.status === 'planning' || a.status === 'baking')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Past bakes: descending order (most recent first)
  const pastAttempts = [...(attempts || [])]
    .filter((a) => a.status === 'done' || !a.status)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const hasAttempts = upcomingAttempts.length > 0 || pastAttempts.length > 0;

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
        {isLoading ? (
          <>
            <Text style={styles.sectionHeader}>UPCOMING</Text>
            <View style={styles.timeline}>
              <View style={styles.timelineLine} />
              {[1, 2].map((i) => (
                <View key={i} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.skeletonWrapper}>
                    <SkeletonCard variant="attempt" />
                  </View>
                </View>
              ))}
            </View>
            <Text style={styles.sectionHeader}>PAST BAKES</Text>
            <View style={styles.timeline}>
              <View style={styles.timelineLine} />
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.skeletonWrapper}>
                    <SkeletonCard variant="attempt" />
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : !hasAttempts ? (
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
          <>
            {upcomingAttempts.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>UPCOMING</Text>
                <View style={styles.timeline}>
                  <View style={styles.timelineLine} />
                  {upcomingAttempts.map((attempt, index) => (
                    <SwipeableAttemptRow
                      key={attempt.attemptId}
                      attempt={attempt}
                      index={index}
                      isFirstInSection={index === 0}
                      onPress={() =>
                        navigation.navigate('AttemptDetail', {
                          attemptId: attempt.attemptId,
                        })
                      }
                      onDelete={() => handleDelete(attempt.attemptId, attempt.name)}
                    />
                  ))}
                </View>
              </>
            )}

            {pastAttempts.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>PAST BAKES</Text>
                <View style={styles.timeline}>
                  <View style={styles.timelineLine} />
                  {pastAttempts.map((attempt, index) => (
                    <SwipeableAttemptRow
                      key={attempt.attemptId}
                      attempt={attempt}
                      index={index}
                      isFirstInSection={index === 0}
                      onPress={() =>
                        navigation.navigate('AttemptDetail', {
                          attemptId: attempt.attemptId,
                        })
                      }
                      onDelete={() => handleDelete(attempt.attemptId, attempt.name)}
                    />
                  ))}
                </View>
              </>
            )}
          </>
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

function SwipeableAttemptRow({
  attempt,
  index,
  isFirstInSection,
  onPress,
  onDelete,
}: {
  attempt: Attempt;
  index: number;
  isFirstInSection: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const statusStyle = getStatusBadgeStyle(attempt.status);
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.deleteActionContainer}>
        <Animated.View
          style={[styles.deleteAction, { transform: [{ translateX }] }]}
        >
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              swipeableRef.current?.close();
              onDelete();
            }}
          >
            <Icon name="delete" color={colors.white} size="md" />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.timelineItem}>
      {/* Timeline dot */}
      <View
        style={[
          styles.timelineDot,
          { backgroundColor: statusStyle.dot },
        ]}
      />

      <View style={styles.swipeableWrapper}>
        <Swipeable
          ref={swipeableRef}
          renderRightActions={renderRightActions}
          rightThreshold={40}
          overshootRight={false}
        >
          <TouchableOpacity
            style={[
              styles.attemptCard,
              !isFirstInSection && styles.attemptCardFaded,
            ]}
            onPress={onPress}
            activeOpacity={0.8}
          >
            <View style={styles.attemptHeader}>
              <Text style={styles.attemptDate}>
                {new Date(attempt.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                  {getStatusLabel(attempt.status)}
                </Text>
              </View>
            </View>
            <Text style={styles.attemptName}>{attempt.name}</Text>
          </TouchableOpacity>
        </Swipeable>
      </View>
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
  sectionHeader: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing[6],
    marginBottom: spacing[2],
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
  swipeableWrapper: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: borderRadius.xl,
  },
  skeletonWrapper: {
    flex: 1,
  },
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
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  attemptName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
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
  deleteActionContainer: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  deleteAction: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 72,
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing[2],
  },
  deleteText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.white,
    marginTop: spacing[1],
  },
});
