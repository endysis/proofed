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
import { useProofedItems } from '../hooks/useProofedItems';
import { Loading, Icon } from '../components/common';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../theme';

export default function ProofedScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: proofedItems, isLoading, error } = useProofedItems();

  if (isLoading) return <Loading />;
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Error loading proofed items</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Proofed</Text>
          <Text style={styles.subtitle}>Your proven recipes, ready to bake</Text>
        </View>
        <View style={styles.headerIcon}>
          <Icon name="verified" color={colors.primary} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {proofedItems?.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <Icon name="verified" size="xl" color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No proofed items yet</Text>
            <Text style={styles.emptyDescription}>
              Capture a successful attempt to add it here
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Tabs', { screen: 'Bakes' })}
            >
              <Text style={styles.emptyLink}>View Attempts</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {proofedItems?.map((item) => (
              <TouchableOpacity
                key={item.proofedItemId}
                style={styles.itemCard}
                onPress={() =>
                  navigation.navigate('ProofedItemDetail', {
                    proofedItemId: item.proofedItemId,
                  })
                }
                activeOpacity={0.8}
              >
                <View style={styles.itemContent}>
                  <View style={styles.itemIcon}>
                    <Icon name="verified" color={colors.primary} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.notes && (
                      <Text style={styles.itemNotes} numberOfLines={2}>
                        {item.notes}
                      </Text>
                    )}
                    <View style={styles.itemMeta}>
                      <View style={styles.itemsBadge}>
                        <Text style={styles.itemsBadgeText}>
                          {item.itemConfigs?.length || 0} items
                        </Text>
                      </View>
                      <Text style={styles.itemDate}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <Icon name="chevron_right" color={colors.dustyMauve} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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
    alignItems: 'flex-start',
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
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
  },
  itemNotes: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    marginTop: spacing[1],
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
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
  itemDate: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
  },
});
