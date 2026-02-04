import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useItems, useCreateItem } from '../hooks/useItems';
import { Loading, Icon, Modal } from '../components/common';
import ItemForm from '../components/items/ItemForm';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../theme';
import type { CreateItemRequest, Item, ItemType } from '@proofed/shared';

const typeIcons: Record<string, string> = {
  batter: 'cake',
  frosting: 'water_drop',
  filling: 'icecream',
  dough: 'cookie',
  glaze: 'format_paint',
  other: 'category',
};

const typeLabels: Record<ItemType, string> = {
  batter: 'Batters',
  frosting: 'Frostings',
  filling: 'Fillings',
  dough: 'Doughs',
  glaze: 'Glazes',
  other: 'Other',
};

const typeOrder: ItemType[] = ['batter', 'dough', 'frosting', 'filling', 'glaze', 'other'];

export default function PantryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: items, isLoading } = useItems();
  const createItem = useCreateItem();

  // Group items by type
  const groupedItems = useMemo((): Record<ItemType, Item[]> => {
    const groups: Record<ItemType, Item[]> = {
      batter: [],
      frosting: [],
      filling: [],
      dough: [],
      glaze: [],
      other: [],
    };
    if (!items) return groups;
    items.forEach((item) => {
      groups[item.type].push(item);
    });
    return groups;
  }, [items]);

  const handleCreate = (data: CreateItemRequest) => {
    createItem.mutate(data, {
      onSuccess: () => setIsModalOpen(false),
    });
  };

  if (isLoading) return <Loading />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Pantry</Text>
          <Text style={styles.subtitle}>Your recipe building blocks</Text>
        </View>
        <TouchableOpacity style={styles.searchButton}>
          <Icon name="search" color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items?.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <Icon name="add_circle" size="xl" color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.emptyDescription}>
              Create your first building block
            </Text>
            <TouchableOpacity onPress={() => setIsModalOpen(true)}>
              <Text style={styles.emptyLink}>Create Item</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {typeOrder.map((type) => {
              const typeItems = groupedItems[type];
              if (!typeItems || typeItems.length === 0) return null;
              return (
                <View key={type} style={styles.typeSection}>
                  <View style={styles.typeSectionHeader}>
                    <Icon
                      name={typeIcons[type]}
                      size="sm"
                      color={colors.dustyMauve}
                    />
                    <Text style={styles.typeSectionTitle}>
                      {typeLabels[type]}
                    </Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>
                        {typeItems.length}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.typeItems}>
                    {typeItems.map((item: Item) => (
                      <TouchableOpacity
                        key={item.itemId}
                        style={styles.itemCard}
                        onPress={() =>
                          navigation.navigate('ItemDetail', {
                            itemId: item.itemId,
                          })
                        }
                        activeOpacity={0.8}
                      >
                        <View style={styles.itemContent}>
                          <View style={styles.itemIcon}>
                            <Icon
                              name={typeIcons[item.type] || 'category'}
                              size="sm"
                              color={colors.primary}
                            />
                          </View>
                          <View style={styles.itemInfo}>
                            <Text style={styles.itemName} numberOfLines={1}>
                              {item.name}
                            </Text>
                            {item.notes && (
                              <Text style={styles.itemNotes} numberOfLines={1}>
                                {item.notes}
                              </Text>
                            )}
                          </View>
                        </View>
                        <Icon
                          name="chevron_right"
                          color={colors.dustyMauve}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 96 + insets.bottom }]}
        onPress={() => setIsModalOpen(true)}
        activeOpacity={0.8}
      >
        <Icon name="add" size="lg" color={colors.white} />
      </TouchableOpacity>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Item"
      >
        <ItemForm
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
          isLoading={createItem.isPending}
        />
      </Modal>
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
    fontSize: fontSize.xl,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
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
  itemsList: {
    marginTop: spacing[4],
    gap: spacing[6],
  },
  typeSection: {
    gap: spacing[3],
  },
  typeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  typeSectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  countBadge: {
    backgroundColor: colors.bgLight,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.full,
  },
  countBadgeText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: 'rgba(157, 129, 137, 0.6)',
  },
  typeItems: {
    gap: spacing[2],
  },
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
  itemIcon: {
    width: 40,
    height: 40,
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
    fontSize: fontSize.xs,
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
