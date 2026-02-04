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
import { Loading, Icon } from '../components/common';
import { formatRelativeDate } from '../utils/formatDate';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../theme';
import type { Attempt } from '@proofed/shared';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: attempts, isLoading } = useAttempts();

  if (isLoading) return <Loading />;

  const recentAttempts = attempts?.slice(0, 5) || [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Icon name="person" color={colors.primary} />
          </View>
        </View>
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
        {recentAttempts.length > 0 ? (
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
      </ScrollView>
    </View>
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
  const { data: url } = usePhotoUrl(photoKey);

  return (
    <View style={styles.thumbnail}>
      {url ? (
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
});
