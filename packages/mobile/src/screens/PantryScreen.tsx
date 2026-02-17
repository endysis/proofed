import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useItems, useCreateItem } from '../hooks/useItems';
import { Icon, Modal, Skeleton } from '../components/common';
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

const categories: { key: 'all' | ItemType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'batter', label: 'Batters' },
  { key: 'frosting', label: 'Frostings' },
  { key: 'filling', label: 'Fillings' },
  { key: 'dough', label: 'Doughs' },
  { key: 'glaze', label: 'Glazes' },
  { key: 'other', label: 'Other' },
];

const { width: screenWidth } = Dimensions.get('window');
const cardGap = spacing[3];
const horizontalPadding = spacing[4];
const cardWidth = (screenWidth - horizontalPadding * 2 - cardGap) / 2;

interface PantryItemCardProps {
  item: Item;
  onPress: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

function PantryItemCard({
  item,
  onPress,
  isFavorite,
  onToggleFavorite,
}: PantryItemCardProps) {
  return (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconArea}>
        <View style={styles.iconTile}>
          <Icon
            name={typeIcons[item.type] || 'category'}
            size="lg"
            color={colors.dustyMauve}
          />
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon
            name={isFavorite ? 'favorite' : 'favorite_border'}
            size="sm"
            color={isFavorite ? colors.primary : colors.dustyMauve}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function SkeletonCard() {
  return (
    <View style={styles.itemCard}>
      <View style={styles.iconArea}>
        <View style={styles.iconTile}>
          <Skeleton width={32} height={32} borderRadius={8} />
        </View>
        <View style={styles.favoriteButton}>
          <Skeleton width={16} height={16} borderRadius={8} />
        </View>
      </View>
      <View style={styles.cardContent}>
        <Skeleton width={cardWidth * 0.7} height={16} />
        <Skeleton width={cardWidth * 0.5} height={12} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

// Approximate pill widths for scrolling (padding + text width estimate)
const pillWidths = [50, 75, 85, 70, 70, 65, 60]; // All, Batters, Frostings, Fillings, Doughs, Glazes, Other
const pillGap = spacing[2];

export default function PantryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const pillsScrollRef = useRef<ScrollView>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | ItemType>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { data: items, isLoading } = useItems();
  const createItem = useCreateItem();

  // Auto-scroll pills when category changes
  useEffect(() => {
    const index = categories.findIndex((c) => c.key === selectedCategory);
    if (index >= 0 && pillsScrollRef.current) {
      let scrollX = 0;
      for (let i = 0; i < index; i++) {
        scrollX += pillWidths[i] + pillGap;
      }
      // Center the pill if possible
      const pillCenter = scrollX + pillWidths[index] / 2;
      const targetX = Math.max(0, pillCenter - screenWidth / 2 + horizontalPadding);
      pillsScrollRef.current.scrollTo({ x: targetX, animated: true });
    }
  }, [selectedCategory]);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (selectedCategory === 'all') return items;
    return items.filter((item) => item.type === selectedCategory);
  }, [items, selectedCategory]);

  const handleCreate = (data: CreateItemRequest) => {
    createItem.mutate(data, {
      onSuccess: () => setIsModalOpen(false),
    });
  };

  const toggleFavorite = (itemId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const renderItem = ({ item }: { item: Item }) => (
    <PantryItemCard
      item={item}
      onPress={() => navigation.navigate('ItemDetail', { itemId: item.itemId })}
      isFavorite={favorites.has(item.itemId)}
      onToggleFavorite={() => toggleFavorite(item.itemId)}
    />
  );

  const renderSkeletonGrid = () => (
    <View style={styles.skeletonGrid}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );

  const swipeToCategory = useCallback((direction: 'left' | 'right') => {
    setSelectedCategory((current) => {
      const currentIndex = categories.findIndex((c) => c.key === current);
      if (direction === 'left' && currentIndex < categories.length - 1) {
        return categories[currentIndex + 1].key;
      } else if (direction === 'right' && currentIndex > 0) {
        return categories[currentIndex - 1].key;
      }
      return current;
    });
  }, []);

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .onEnd((event) => {
      'worklet';
      if (event.velocityX < -500 || event.translationX < -50) {
        runOnJS(swipeToCategory)('left');
      } else if (event.velocityX > 500 || event.translationX > 50) {
        runOnJS(swipeToCategory)('right');
      }
    });

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

      {/* Filter Pills */}
      <ScrollView
        ref={pillsScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {categories.map((category) => {
          const isActive = selectedCategory === category.key;
          return (
            <TouchableOpacity
              key={category.key}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              onPress={() => setSelectedCategory(category.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterPillText,
                  isActive && styles.filterPillTextActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      <GestureDetector gesture={swipeGesture}>
        <View style={styles.content}>
          {isLoading ? (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {renderSkeletonGrid()}
            </ScrollView>
          ) : items?.length === 0 ? (
            <View style={styles.emptyContainer}>
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
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconContainer}>
                  <Icon name="filter_list" size="xl" color={colors.dustyMauve} />
                </View>
                <Text style={styles.emptyTitle}>No items in this category</Text>
                <Text style={styles.emptyDescription}>
                  Try selecting a different filter
                </Text>
              </View>
            </View>
          ) : (
            <FlatList
              data={filteredItems}
              renderItem={renderItem}
              keyExtractor={(item) => item.itemId}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.gridContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </GestureDetector>

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
  filterContainer: {
    flexGrow: 0,
    flexShrink: 0,
    height: 56,
    marginBottom: spacing[3],
  },
  filterContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  filterPill: {
    paddingHorizontal: spacing[4],
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  filterPillTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[20],
  },
  gridContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[20],
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    width: cardWidth,
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing[3],
  },
  iconArea: {
    height: 120,
    backgroundColor: `${colors.white}20`,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconTile: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    backgroundColor: `${colors.pastelPink}40`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
  },
  cardContent: {
    padding: spacing[3],
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
    lineHeight: fontSize.sm * 1.3,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  emptyCard: {
    marginTop: spacing[4],
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
    backgroundColor: `${colors.primary}15`,
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
  fab: {
    position: 'absolute',
    right: spacing[4],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
