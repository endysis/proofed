import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAttempts } from '../hooks/useAttempts';
import { usePhotoUrl } from '../hooks/usePhotos';
import { Icon, SkeletonCard, SkeletonThumbnail } from '../components/common';
import { formatRelativeDate } from '../utils/formatDate';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../theme';
import type { Attempt, AttemptStatus } from '@proofed/shared';

const getStatusStyle = (status?: AttemptStatus) => {
  switch (status) {
    case 'planning':
      return { bg: '#FFF3CD', text: '#856404', border: '#F59E0B' };
    case 'baking':
      return { bg: '#D4EDDA', text: '#155724', border: '#10B981' };
    default:
      return { bg: '#E2E3E5', text: '#6C757D', border: colors.dustyMauve };
  }
};

const getStatusLabel = (status?: AttemptStatus) => {
  switch (status) {
    case 'planning':
      return 'Planned';
    case 'baking':
      return 'Baking';
    default:
      return 'Done';
  }
};

const formatUpcomingDate = (date?: string) => {
  if (!date) return 'TBD';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: attempts, isLoading } = useAttempts();

  // Sort by date (most recent first), filter to done status only
  const recentAttempts =
    attempts
      ?.filter((a) => a.status === 'done')
      .slice()
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5) || [];

  // Upcoming bakes: ascending order (earliest first - shows what's next)
  const upcomingAttempts =
    attempts
      ?.filter((a) => a.status === 'planning' || a.status === 'baking')
      .slice()
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      }) || [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => navigation.navigate('Settings')}
        >
          <View style={styles.avatar}>
            <Icon name="person" color={colors.primary} />
          </View>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.headerTitle}>Happy Baking!</Text>
        </View>
        <TouchableOpacity style={styles.searchButton}>
          <Icon name="search" color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Recent Bakes Section */}
        {isLoading ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Bakes</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
            >
              <SkeletonCard variant="featured" />
              <SkeletonCard variant="featured" />
            </ScrollView>
          </View>
        ) : recentAttempts.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Bakes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'Bakes' })}>
                <Text style={styles.viewAllLink}>View all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
            >
              {recentAttempts.map((attempt) => (
                <AttemptCard
                  key={attempt.attemptId}
                  attempt={attempt}
                  onPress={() =>
                    navigation.navigate('AttemptDetail', { attemptId: attempt.attemptId })
                  }
                />
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconContainer}>
                <Icon name="menu_book" size="xl" color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No bakes yet</Text>
              <Text style={styles.emptyDescription}>Start your first baking session</Text>
              <TouchableOpacity onPress={() => navigation.navigate('NewAttempt')}>
                <Text style={styles.emptyLink}>Start Baking</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Upcoming Bakes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Bakes</Text>
            {!isLoading && upcomingAttempts.length > 0 && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Tabs', { screen: 'Bakes' })}
              >
                <Text style={styles.viewAllLink}>See Schedule</Text>
              </TouchableOpacity>
            )}
          </View>
          {isLoading ? (
            <View style={styles.upcomingList}>
              <SkeletonCard variant="attempt" />
              <SkeletonCard variant="attempt" />
            </View>
          ) : upcomingAttempts.length > 0 ? (
            <View style={styles.upcomingList}>
              {upcomingAttempts.map((attempt) => (
                <UpcomingBakeCard
                  key={attempt.attemptId}
                  attempt={attempt}
                  onPress={() =>
                    navigation.navigate('AttemptDetail', { attemptId: attempt.attemptId })
                  }
                />
              ))}
            </View>
          ) : (
            <View style={styles.upcomingEmptyContainer}>
              <TouchableOpacity
                style={styles.upcomingEmptyCard}
                onPress={() => navigation.navigate('NewAttempt')}
                activeOpacity={0.8}
              >
                <View style={styles.upcomingEmptyIcon}>
                  <Icon name="event" size="lg" color={colors.primary} />
                </View>
                <View style={styles.upcomingEmptyContent}>
                  <Text style={styles.upcomingEmptyTitle}>Nothing planned yet</Text>
                  <Text style={styles.upcomingEmptyDescription}>
                    Start planning your next bake
                  </Text>
                </View>
                <Icon name="add" size="md" color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function UpcomingBakeCard({
  attempt,
  onPress,
}: {
  attempt: Attempt;
  onPress: () => void;
}) {
  const statusStyle = getStatusStyle(attempt.status);

  return (
    <TouchableOpacity
      style={[styles.upcomingCard, { borderLeftColor: statusStyle.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.upcomingHeader}>
        <Text style={styles.upcomingName} numberOfLines={1}>
          {attempt.name}
        </Text>
        <View style={styles.menuButton}>
          <Icon name="more_horiz" color={colors.dustyMauve} />
        </View>
      </View>

      <View style={styles.upcomingDateRow}>
        <Icon name="event" size="sm" color={colors.dustyMauve} />
        <Text style={styles.upcomingDate}>{formatUpcomingDate(attempt.date)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
            {getStatusLabel(attempt.status)}
          </Text>
        </View>
      </View>

      {attempt.itemUsages && attempt.itemUsages.length > 0 && (
        <View style={styles.itemTags}>
          <View style={styles.itemTag}>
            <Text style={styles.itemTagText}>
              {attempt.itemUsages.length} item{attempt.itemUsages.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function AttemptCard({
  attempt,
  onPress,
}: {
  attempt: Attempt;
  onPress: () => void;
}) {
  const relativeDate = attempt.date ? formatRelativeDate(attempt.date) : undefined;

  return (
    <TouchableOpacity style={styles.attemptCard} onPress={onPress} activeOpacity={0.8}>
      <AttemptThumbnail
        photoKey={attempt.mainPhotoKey || attempt.photoKeys?.[0]}
        relativeDate={relativeDate}
      />
      <View style={styles.attemptInfo}>
        <Text style={styles.attemptName} numberOfLines={1}>
          {attempt.name}
        </Text>
        <View style={styles.attemptMeta}>
          <View style={styles.itemsBadge}>
            <Text style={styles.itemsBadgeText}>
              {attempt.itemUsages?.length || 0} items
            </Text>
          </View>
          {attempt.date && (
            <Text style={styles.attemptDate}>
              {new Date(attempt.date).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function AttemptThumbnail({
  photoKey,
  relativeDate,
}: {
  photoKey?: string;
  relativeDate?: string;
}) {
  const { data: url, isLoading } = usePhotoUrl(photoKey);

  return (
    <View style={styles.thumbnail}>
      {isLoading ? (
        <SkeletonThumbnail size="featured" style={styles.thumbnailSkeleton} />
      ) : url ? (
        <Image source={{ uri: url }} style={styles.thumbnailImage} />
      ) : (
        <Icon name="menu_book" size="xl" color={colors.dustyMauve} />
      )}
      {relativeDate && (
        <View style={styles.dateTag}>
          <Text style={styles.dateTagText}>{relativeDate}</Text>
        </View>
      )}
    </View>
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
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    paddingBottom: spacing[2],
  },
  avatarContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    paddingHorizontal: spacing[2],
  },
  welcomeText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  section: {
    paddingTop: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.text,
    letterSpacing: -0.3,
  },
  viewAllLink: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  carouselContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[4],
  },
  attemptCard: {
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
  attemptInfo: {
    marginTop: spacing[3],
  },
  attemptName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
  },
  attemptMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
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
  attemptDate: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(244, 172, 183, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailSkeleton: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  dateTag: {
    position: 'absolute',
    top: spacing[2],
    left: spacing[2],
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.default,
  },
  dateTagText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    marginTop: spacing[8],
    paddingHorizontal: spacing[4],
  },
  emptyCard: {
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
  upcomingList: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  upcomingCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderLeftWidth: 4,
    borderLeftColor: colors.dustyMauve,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
    flex: 1,
  },
  menuButton: {
    padding: spacing[1],
  },
  upcomingDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  upcomingDate: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
  },
  itemTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  itemTag: {
    backgroundColor: '#f4f0f1',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  itemTagText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
  },
  upcomingEmptyContainer: {
    paddingHorizontal: spacing[4],
  },
  upcomingEmptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderStyle: 'dashed',
  },
  upcomingEmptyIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  upcomingEmptyContent: {
    flex: 1,
  },
  upcomingEmptyTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
  },
  upcomingEmptyDescription: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    marginTop: spacing[0.5],
  },
});
