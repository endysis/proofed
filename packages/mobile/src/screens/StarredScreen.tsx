import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStarredAttempts } from '../hooks/useAttempts';
import { usePhotoUrl } from '../hooks/usePhotos';
import { Loading, Icon } from '../components/common';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../theme';
import type { Attempt, AttemptStatus } from '@proofed/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function getStatusBadge(status?: AttemptStatus) {
  switch (status) {
    case 'planning':
      return { label: 'PLAN', bg: colors.pastelPink, color: colors.primary };
    case 'baking':
      return { label: 'IN PROGRESS', bg: '#FFF3CD', color: '#856404' };
    case 'done':
      return { label: 'COMPLETE', bg: '#D4EDDA', color: '#155724' };
    default:
      return { label: 'PLAN', bg: colors.pastelPink, color: colors.primary };
  }
}

function navigateToAttempt(navigation: NavigationProp, attempt: Attempt) {
  switch (attempt.status) {
    case 'baking':
      navigation.navigate('BakeScreen', { attemptId: attempt.attemptId });
      break;
    case 'done':
      navigation.navigate('EvaluateScreen', { attemptId: attempt.attemptId });
      break;
    default:
      navigation.navigate('PlanScreen', { attemptId: attempt.attemptId });
  }
}

export default function StarredScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { data: starredAttempts, isLoading, error } = useStarredAttempts();

  if (isLoading) return <Loading />;
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Error loading starred bakes</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Starred Bakes</Text>
          <Text style={styles.subtitle}>Your favorite baking sessions</Text>
        </View>
        <View style={styles.headerIcon}>
          <Icon name="favorite" color={colors.primary} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {starredAttempts?.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <Icon name="favorite_border" size="xl" color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No starred bakes yet</Text>
            <Text style={styles.emptyDescription}>
              Star your favorite bakes to find them here
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Tabs', { screen: 'Bakes' })}
            >
              <Text style={styles.emptyLink}>View Bakes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {starredAttempts?.map((attempt) => (
              <AttemptCard
                key={attempt.attemptId}
                attempt={attempt}
                onPress={() => navigateToAttempt(navigation, attempt)}
              />
            ))}
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
  const statusBadge = getStatusBadge(attempt.status);
  const photoKey = attempt.mainPhotoKey || attempt.photoKeys?.[0];

  return (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.itemContent}>
        {photoKey ? (
          <AttemptThumbnail photoKey={photoKey} />
        ) : (
          <View style={styles.itemIcon}>
            <Icon name="bakery_dining" color={colors.primary} />
          </View>
        )}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>
            {attempt.name}
          </Text>
          <View style={styles.itemMeta}>
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
                {statusBadge.label}
              </Text>
            </View>
            <Text style={styles.itemDate}>
              {new Date(attempt.date).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <Icon name="chevron_right" color={colors.dustyMauve} />
      </View>
    </TouchableOpacity>
  );
}

function AttemptThumbnail({ photoKey }: { photoKey: string }) {
  const { data: url, isLoading } = usePhotoUrl(photoKey);

  if (isLoading || !url) {
    return (
      <View style={styles.itemIcon}>
        <Icon name="image" color={colors.dustyMauve} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: url }}
      style={styles.thumbnail}
      resizeMode="cover"
    />
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
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
  },
  emptyLink: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  itemsList: {
    marginTop: spacing[4],
    gap: spacing[3],
  },
  itemCard: {
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
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    letterSpacing: 0.5,
  },
  itemDate: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
  },
});
