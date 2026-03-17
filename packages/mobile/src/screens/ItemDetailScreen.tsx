import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Icon, Modal, Loading, Badge, SupplierFavicon } from '../components/common';
import { ItemForm } from '../components/items';
import { RecipeForm } from '../components/recipes';
import { VariantForm } from '../components/variants';
import ContainerScaleModal from '../components/scaling/ContainerScaleModal';
import { useItem, useUpdateItem, useDeleteItem } from '../hooks/useItems';
import { useRecipes, useCreateRecipe, useUpdateRecipe, useDeleteRecipe } from '../hooks/useRecipes';
import { useVariants, useCreateVariant, useUpdateVariant, useDeleteVariant } from '../hooks/useVariants';
import { scaleIngredients, getScaleOptions, formatScaleFactor, calculateScaleFromIngredient } from '../utils/scaleRecipe';
import { formatContainer } from '../constants/containers';
import { getSupplierById } from '../constants/suppliers';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { Recipe, Variant, Ingredient, CreateItemRequest, CreateRecipeRequest, CreateVariantRequest, ItemType } from '@proofed/shared';

type ItemDetailRouteProp = RouteProp<RootStackParamList, 'ItemDetail'>;

const typeIcons: Record<string, string> = {
  batter: 'cake',
  frosting: 'water_drop',
  filling: 'icecream',
  dough: 'cookie',
  glaze: 'format_paint',
  other: 'category',
};

export default function ItemDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<ItemDetailRouteProp>();
  const { itemId } = route.params;

  const { data: item, isLoading: itemLoading } = useItem(itemId);
  const { data: recipes, isLoading: recipesLoading } = useRecipes(itemId);
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant();
  const deleteVariant = useDeleteVariant();

  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(route.params.recipeId ?? null);
  const [viewScale, setViewScale] = useState(route.params.scale ?? 1);
  const [editItemModal, setEditItemModal] = useState(false);
  const [recipeModal, setRecipeModal] = useState<{ isOpen: boolean; recipe?: Recipe }>({ isOpen: false });
  const [variantModal, setVariantModal] = useState<{
    isOpen: boolean;
    recipeId?: string;
    variant?: Variant;
  }>({ isOpen: false });
  const [viewVariantModal, setViewVariantModal] = useState<{
    variant: Variant;
    recipe: Recipe;
  } | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showPrepNotesModal, setShowPrepNotesModal] = useState(false);

  // Scale by ingredient/container state
  const [showScaleByIngredient, setShowScaleByIngredient] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [ingredientAmount, setIngredientAmount] = useState('');
  const [showContainerScale, setShowContainerScale] = useState(false);

  const [selectedSourceKey, setSelectedSourceKey] = useState<string | null>(null);

  // Group recipes by source for filtering
  const sourceGroups = useMemo(() => {
    if (!recipes || recipes.length === 0) return [];

    const groupMap = new Map<string, { key: string; label: string; supplierId?: string; customUrl?: string; isStoreBought?: boolean; recipes: Recipe[] }>();

    for (const recipe of recipes) {
      let key: string;
      let label: string;
      let supplierId: string | undefined;
      let customUrl: string | undefined;
      let isStoreBought: boolean | undefined;

      if (recipe.isStoreBought) {
        key = 'store-bought';
        label = 'Store-Bought';
        isStoreBought = true;
      } else if (recipe.supplierId) {
        key = recipe.supplierId;
        label = getSupplierById(recipe.supplierId)?.name ?? recipe.supplierId;
        supplierId = recipe.supplierId;
      } else if (recipe.customSourceName) {
        key = `custom:${recipe.customSourceName}`;
        label = recipe.customSourceName;
        customUrl = recipe.customSourceUrl ?? undefined;
      } else {
        key = 'my-recipes';
        label = 'My Recipes';
      }

      const existing = groupMap.get(key);
      if (existing) {
        existing.recipes.push(recipe);
      } else {
        groupMap.set(key, { key, label, supplierId, customUrl, isStoreBought, recipes: [recipe] });
      }
    }

    // Sort: predefined suppliers alpha, custom sources alpha, "My Recipes", "Store-Bought" last
    return Array.from(groupMap.values()).sort((a, b) => {
      const order = (g: typeof a) => {
        if (g.supplierId) return 0;
        if (g.key.startsWith('custom:')) return 1;
        if (g.key === 'my-recipes') return 2;
        return 3; // store-bought
      };
      const oa = order(a), ob = order(b);
      if (oa !== ob) return oa - ob;
      return a.label.localeCompare(b.label);
    });
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];
    if (!selectedSourceKey) return recipes;
    const group = sourceGroups.find((g) => g.key === selectedSourceKey);
    return group ? group.recipes : recipes;
  }, [recipes, sourceGroups, selectedSourceKey]);

  // Reset source filter if selected source group no longer exists
  useEffect(() => {
    if (selectedSourceKey && !sourceGroups.find((g) => g.key === selectedSourceKey)) {
      setSelectedSourceKey(null);
    }
  }, [sourceGroups, selectedSourceKey]);

  useEffect(() => {
    if (recipes && recipes.length > 0 && !selectedRecipeId) {
      setSelectedRecipeId(recipes[0].recipeId);
    }
  }, [recipes, selectedRecipeId]);

  // When filtered recipes change and current selection isn't in the list, auto-select first
  useEffect(() => {
    if (filteredRecipes.length > 0 && selectedRecipeId && !filteredRecipes.find((r) => r.recipeId === selectedRecipeId)) {
      setSelectedRecipeId(filteredRecipes[0].recipeId);
    }
  }, [filteredRecipes, selectedRecipeId]);

  const sourceKey = (r: Recipe) => {
    if (r.supplierId) return `supplier:${r.supplierId}`;
    if (r.customSourceName) return `custom:${r.customSourceName}`;
    if (r.isStoreBought) return 'store-bought';
    return 'personal';
  };

  const uniqueSourceChips = useMemo(() => {
    if (!filteredRecipes || filteredRecipes.length === 0) return [];
    const seen = new Set<string>();
    return filteredRecipes.filter((r) => {
      const key = sourceKey(r);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [filteredRecipes]);

  const selectedSourceRecipes = useMemo(() => {
    const selected = recipes?.find((r) => r.recipeId === selectedRecipeId) || recipes?.[0];
    if (!selected || !filteredRecipes || filteredRecipes.length <= 1) return [];
    return filteredRecipes.filter((r) => sourceKey(r) === sourceKey(selected));
  }, [recipes, selectedRecipeId, filteredRecipes]);

  const handleUpdateItem = (data: CreateItemRequest) => {
    updateItem.mutate({ itemId, data }, { onSuccess: () => setEditItemModal(false) });
  };

  const handleDeleteItem = () => {
    Alert.alert(
      'Delete Item',
      'Delete this item? All recipes and variants will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteItem.mutate(itemId, { onSuccess: () => navigation.goBack() });
          },
        },
      ]
    );
  };

  const handleCreateRecipe = (data: CreateRecipeRequest) => {
    createRecipe.mutate({ itemId, data }, { onSuccess: () => setRecipeModal({ isOpen: false }) });
  };

  const handleUpdateRecipe = (data: CreateRecipeRequest) => {
    if (recipeModal.recipe) {
      updateRecipe.mutate(
        { itemId, recipeId: recipeModal.recipe.recipeId, data },
        { onSuccess: () => setRecipeModal({ isOpen: false }) }
      );
    }
  };

  const handleDeleteRecipe = (recipeId: string) => {
    Alert.alert('Delete Recipe', 'Delete this recipe and all its variants?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteRecipe.mutate({ itemId, recipeId }),
      },
    ]);
  };

  const handleCreateVariant = (data: CreateVariantRequest) => {
    if (variantModal.recipeId) {
      createVariant.mutate(
        { itemId, recipeId: variantModal.recipeId, data },
        { onSuccess: () => setVariantModal({ isOpen: false }) }
      );
    }
  };

  const handleUpdateVariant = (data: CreateVariantRequest) => {
    if (variantModal.variant && variantModal.recipeId) {
      updateVariant.mutate(
        {
          itemId,
          recipeId: variantModal.recipeId,
          variantId: variantModal.variant.variantId,
          data,
        },
        { onSuccess: () => setVariantModal({ isOpen: false }) }
      );
    }
  };

  const handleDeleteVariant = (recipeId: string, variantId: string) => {
    Alert.alert('Delete Variant', 'Delete this variant?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteVariant.mutate({ itemId, recipeId, variantId }),
      },
    ]);
  };

  if (itemLoading || recipesLoading) return <Loading />;
  if (!item) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Item not found</Text>
      </View>
    );
  }

  const selectedRecipe = recipes?.find((r) => r.recipeId === selectedRecipeId) || recipes?.[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow_back_ios" color={colors.text} size="md" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pantry Item</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => setShowActions(true)}>
          <Icon name="more_vert" color={colors.text} size="md" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name={typeIcons[item.type] || 'category'} size="xl" color={colors.primary} />
          </View>
          <Text style={styles.typeLabel}>{item.type}</Text>
        </View>

        {/* Item Name & Notes */}
        <Text style={styles.itemName}>{item.name}</Text>
        {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}

        {/* Recipes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recipes</Text>
            <TouchableOpacity onPress={() => setRecipeModal({ isOpen: true })}>
              <Text style={styles.addLink}>Add New</Text>
            </TouchableOpacity>
          </View>

          {/* Source Filter Chips */}
          {sourceGroups.length >= 2 && (recipes?.length ?? 0) >= 5 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.sourceChipsScroll}
              contentContainerStyle={styles.chipsContainer}
            >
              <TouchableOpacity
                style={[styles.sourceChip, !selectedSourceKey && styles.sourceChipActive]}
                onPress={() => setSelectedSourceKey(null)}
              >
                <Text style={[styles.sourceChipText, !selectedSourceKey && styles.sourceChipTextActive]}>
                  All ({recipes?.length ?? 0})
                </Text>
              </TouchableOpacity>
              {sourceGroups.map((group) => (
                <TouchableOpacity
                  key={group.key}
                  style={[styles.sourceChip, selectedSourceKey === group.key && styles.sourceChipActive]}
                  onPress={() => setSelectedSourceKey(group.key)}
                >
                  <View style={styles.sourceChipContent}>
                    {group.isStoreBought ? (
                      <Icon name="shopping_cart" size="sm" color={selectedSourceKey === group.key ? colors.white : colors.dustyMauve} />
                    ) : group.supplierId || group.customUrl ? (
                      <SupplierFavicon supplierId={group.supplierId} customUrl={group.customUrl} size={16} />
                    ) : group.key === 'my-recipes' ? (
                      <Icon name="person" size="sm" color={selectedSourceKey === group.key ? colors.white : colors.dustyMauve} />
                    ) : null}
                    <Text style={[styles.sourceChipText, selectedSourceKey === group.key && styles.sourceChipTextActive]}>
                      {group.label} ({group.recipes.length})
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Recipe Chips (deduplicated by source) */}
          {uniqueSourceChips.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
              contentContainerStyle={styles.chipsContainer}
            >
              {uniqueSourceChips.map((recipe) => {
                const isActive = selectedRecipe && sourceKey(selectedRecipe) === sourceKey(recipe);
                const showSourceIcon = sourceGroups.length >= 2;
                const iconColor = isActive ? colors.white : colors.dustyMauve;
                return (
                  <TouchableOpacity
                    key={sourceKey(recipe)}
                    style={[
                      styles.chip,
                      isActive && styles.chipActive,
                    ]}
                    onPress={() => setSelectedRecipeId(recipe.recipeId)}
                  >
                    <View style={styles.chipInner}>
                      {showSourceIcon && (
                        recipe.isStoreBought ? (
                          <Icon name="shopping_cart" size="sm" color={iconColor} />
                        ) : recipe.supplierId ? (
                          <SupplierFavicon supplierId={recipe.supplierId} size={16} />
                        ) : recipe.customSourceName ? (
                          <SupplierFavicon customUrl={recipe.customSourceUrl ?? undefined} size={16} />
                        ) : (
                          <Icon name="person" size="sm" color={iconColor} />
                        )
                      )}
                      <Text
                        style={[
                          styles.chipText,
                          isActive && styles.chipTextActive,
                        ]}
                      >
                        {recipe.supplierId
                          ? getSupplierById(recipe.supplierId)?.name ?? recipe.name
                          : recipe.customSourceName
                            ? recipe.customSourceName
                            : recipe.isStoreBought && recipe.brand
                              ? recipe.brand
                              : recipe.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {selectedSourceRecipes.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
              contentContainerStyle={styles.chipsContainer}
            >
              {selectedSourceRecipes.map((recipe) => {
                const isActive = selectedRecipe?.recipeId === recipe.recipeId;
                return (
                  <TouchableOpacity
                    key={recipe.recipeId}
                    style={[styles.subChip, isActive && styles.subChipActive]}
                    onPress={() => setSelectedRecipeId(recipe.recipeId)}
                  >
                    <Text style={[styles.subChipText, isActive && styles.subChipTextActive]}>
                      {recipe.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Selected Recipe Card */}
          {selectedRecipe ? (
            <View style={styles.recipeCard}>
              <View style={styles.recipeHeader}>
                <View style={styles.recipeNameColumn}>
                  <View style={styles.recipeNameRow}>
                    {selectedRecipe.isStoreBought ? (
                      <View style={styles.storeBoughtBadge}>
                        <Icon name="shopping_cart" size="sm" color={colors.white} />
                      </View>
                    ) : (selectedRecipe.supplierId || selectedRecipe.customSourceName) ? (
                      <SupplierFavicon
                        supplierId={selectedRecipe.supplierId}
                        customUrl={selectedRecipe.customSourceUrl}
                        size={24}
                      />
                    ) : null}
                    <Text style={styles.recipeSource}>
                      {selectedRecipe.supplierId
                        ? getSupplierById(selectedRecipe.supplierId)?.name ?? selectedRecipe.name
                        : selectedRecipe.customSourceName
                          ? selectedRecipe.customSourceName
                          : selectedRecipe.isStoreBought && selectedRecipe.brand
                            ? selectedRecipe.brand
                            : selectedRecipe.name}
                    </Text>
                  </View>
                  {(selectedRecipe.supplierId || selectedRecipe.customSourceName || (selectedRecipe.isStoreBought && selectedRecipe.brand)) && item?.name ? (
                    <Text style={styles.recipeName}>{item.name}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => setRecipeModal({ isOpen: true, recipe: selectedRecipe })}
                >
                  <Icon name="edit" size="sm" color={colors.dustyMauve} />
                </TouchableOpacity>
              </View>

              {/* Store-bought product info */}
              {selectedRecipe.isStoreBought ? (
                <View style={styles.storeBoughtInfo}>
                  {selectedRecipe.brand && (
                    <View style={styles.storeBoughtRow}>
                      <Text style={styles.storeBoughtLabel}>BRAND</Text>
                      <Text style={styles.storeBoughtValue}>{selectedRecipe.brand}</Text>
                    </View>
                  )}
                  {selectedRecipe.productName && (
                    <View style={styles.storeBoughtRow}>
                      <Text style={styles.storeBoughtLabel}>PRODUCT</Text>
                      <Text style={styles.storeBoughtValue}>{selectedRecipe.productName}</Text>
                    </View>
                  )}
                  {(selectedRecipe.purchaseQuantity || selectedRecipe.purchaseUnit) && (
                    <View style={styles.storeBoughtRow}>
                      <Text style={styles.storeBoughtLabel}>SIZE</Text>
                      <Text style={styles.storeBoughtValue}>
                        {selectedRecipe.purchaseQuantity} {selectedRecipe.purchaseUnit}
                      </Text>
                    </View>
                  )}
                  <View style={styles.purchasedItemNote}>
                    <Icon name="info" size="sm" color={colors.dustyMauve} />
                    <Text style={styles.purchasedItemNoteText}>Purchased item</Text>
                  </View>
                </View>
              ) : (
                <>
                  {/* Bake Settings - only for homemade */}
                  {(selectedRecipe.bakeTime || selectedRecipe.bakeTemp || selectedRecipe.container) && (
                    <View style={styles.bakeSettings}>
                      {selectedRecipe.bakeTime && (
                        <View style={styles.bakeSetting}>
                          <Icon name="timer" size="sm" color={colors.dustyMauve} />
                          <Text style={styles.bakeSettingText}>{selectedRecipe.bakeTime} min</Text>
                        </View>
                      )}
                      {selectedRecipe.bakeTemp && (
                        <View style={styles.bakeSetting}>
                          <Icon name="thermostat" size="sm" color={colors.dustyMauve} />
                          <Text style={styles.bakeSettingText}>
                            {selectedRecipe.bakeTemp}°{selectedRecipe.bakeTempUnit || 'F'}
                          </Text>
                        </View>
                      )}
                      {selectedRecipe.container && (
                        <View style={styles.bakeSetting}>
                          <Icon name="cake" size="sm" color={colors.dustyMauve} />
                          <Text style={styles.bakeSettingText}>
                            {formatContainer(
                              selectedRecipe.container.type,
                              selectedRecipe.container.size ?? 8,
                              selectedRecipe.container.count,
                              viewScale
                            )}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Scale Selector - only for homemade */}
                  <View style={styles.scaleSection}>
                    <View style={styles.scaleLabelRow}>
                      <Text style={styles.scaleLabel}>SCALE:</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.scaleButtons}
                      >
                        {getScaleOptions(selectedRecipe.customScales).map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.scaleButton,
                              viewScale === option.value && styles.scaleButtonActive,
                            ]}
                            onPress={() => setViewScale(option.value)}
                          >
                            <Text
                              style={[
                                styles.scaleButtonText,
                                viewScale === option.value && styles.scaleButtonTextActive,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                    {/* Scale by ingredient and container buttons */}
                    <View style={styles.scaleByRow}>
                      <TouchableOpacity
                        style={styles.scaleByButton}
                        onPress={() => setShowScaleByIngredient(true)}
                      >
                        <Icon name="calculate" size="sm" color={colors.primary} />
                        <Text style={styles.scaleByText}>By Ingredient</Text>
                      </TouchableOpacity>
                      {selectedRecipe.container && (
                        <TouchableOpacity
                          style={styles.scaleByButton}
                          onPress={() => setShowContainerScale(true)}
                        >
                          <Icon name="auto_awesome" size="sm" color={colors.primary} />
                          <Text style={styles.scaleByText}>By Container</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {/* Show custom scale indicator */}
                    {viewScale !== 1 && !getScaleOptions(selectedRecipe.customScales).some(opt => opt.value === viewScale) && (
                      <View style={styles.customScaleBadge}>
                        <Icon name="check_circle" size="sm" color={colors.success} />
                        <Text style={styles.customScaleBadgeText}>
                          Bespoke scale: {formatScaleFactor(viewScale)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Ingredients - only for homemade */}
                  <View style={styles.ingredients}>
                    {scaleIngredients(selectedRecipe.ingredients, viewScale).map((ing, i) => (
                      <View key={i} style={styles.ingredientRow}>
                        <Text style={styles.ingredientName}>{ing.name}</Text>
                        <View style={styles.ingredientValue}>
                          <Text style={styles.ingredientQty}>
                            {ing.quantity} {ing.unit}
                          </Text>
                          {viewScale !== 1 && (
                            <Text style={styles.ingredientOriginal}>
                              (was {selectedRecipe.ingredients[i].quantity})
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Variants Section */}
              <VariantsSection
                itemId={itemId}
                recipe={selectedRecipe}
                onAddVariant={() =>
                  setVariantModal({ isOpen: true, recipeId: selectedRecipe.recipeId })
                }
                onViewVariant={(variant) =>
                  setViewVariantModal({ variant, recipe: selectedRecipe })
                }
                onEditVariant={(variant) =>
                  setVariantModal({
                    isOpen: true,
                    recipeId: selectedRecipe.recipeId,
                    variant,
                  })
                }
                onDeleteVariant={(variantId) =>
                  handleDeleteVariant(selectedRecipe.recipeId, variantId)
                }
              />

              {/* Prep Notes */}
              {selectedRecipe.prepNotes && (
                <TouchableOpacity
                  style={styles.prepNotes}
                  onPress={() => setShowPrepNotesModal(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.prepNotesHeader}>
                    <Text style={styles.prepNotesLabel}>PREP NOTES</Text>
                    <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
                  </View>
                  <Text style={styles.prepNotesText} numberOfLines={2}>
                    {selectedRecipe.prepNotes}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Recipe Actions */}
              <View style={styles.recipeActions}>
                <TouchableOpacity
                  style={styles.recipeAction}
                  onPress={() => setRecipeModal({ isOpen: true, recipe: selectedRecipe })}
                >
                  <Icon name="edit" size="sm" color={colors.primary} />
                  <Text style={styles.recipeActionText}>Edit Recipe</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.recipeAction}
                  onPress={() => handleDeleteRecipe(selectedRecipe.recipeId)}
                >
                  <Icon name="delete" size="sm" color={colors.dustyMauve} />
                  <Text style={[styles.recipeActionText, { color: colors.dustyMauve }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.emptyRecipe}>
              <Text style={styles.emptyText}>No recipes yet</Text>
              <TouchableOpacity onPress={() => setRecipeModal({ isOpen: true })}>
                <Text style={styles.addLink}>Add your first recipe</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Sheet Modal */}
      <Modal isOpen={showActions} onClose={() => setShowActions(false)} title="Item Actions">
        <View style={styles.actionSheet}>
          <TouchableOpacity
            style={styles.actionOption}
            onPress={() => {
              setShowActions(false);
              setEditItemModal(true);
            }}
          >
            <Icon name="edit" color={colors.dustyMauve} size="md" />
            <Text style={styles.actionOptionText}>Edit Item</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionOption}
            onPress={() => {
              setShowActions(false);
              handleDeleteItem();
            }}
          >
            <Icon name="delete" color={colors.primary} size="md" />
            <Text style={[styles.actionOptionText, { color: colors.primary }]}>Delete Item</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Edit Item Modal */}
      <Modal isOpen={editItemModal} onClose={() => setEditItemModal(false)} title="Edit Item">
        <ItemForm
          item={item}
          onSubmit={handleUpdateItem}
          onCancel={() => setEditItemModal(false)}
          isLoading={updateItem.isPending}
        />
      </Modal>

      {/* Recipe Modal */}
      <Modal
        isOpen={recipeModal.isOpen}
        onClose={() => setRecipeModal({ isOpen: false })}
        title={recipeModal.recipe ? 'Edit Recipe' : 'New Recipe'}
      >
        <RecipeForm
          key={recipeModal.recipe?.recipeId || 'new'}
          recipe={recipeModal.recipe}
          onSubmit={recipeModal.recipe ? handleUpdateRecipe : handleCreateRecipe}
          onCancel={() => setRecipeModal({ isOpen: false })}
          isLoading={createRecipe.isPending || updateRecipe.isPending}
          itemName={item?.name}
        />
      </Modal>

      {/* Variant Modal */}
      <Modal
        isOpen={variantModal.isOpen}
        onClose={() => setVariantModal({ isOpen: false })}
        title={variantModal.variant ? 'Edit Variant' : 'New Variant'}
      >
        <VariantForm
          variant={variantModal.variant}
          recipeIngredients={selectedRecipe?.ingredients}
          scaleFactor={viewScale}
          onSubmit={variantModal.variant ? handleUpdateVariant : handleCreateVariant}
          onCancel={() => setVariantModal({ isOpen: false })}
          isLoading={createVariant.isPending || updateVariant.isPending}
        />
      </Modal>

      {/* Variant Comparison Modal */}
      {viewVariantModal && (
        <VariantComparisonModal
          variant={viewVariantModal.variant}
          recipe={viewVariantModal.recipe}
          viewScale={viewScale}
          onClose={() => setViewVariantModal(null)}
        />
      )}

      {/* Scale by Ingredient Modal */}
      <Modal
        isOpen={showScaleByIngredient}
        onClose={() => {
          setShowScaleByIngredient(false);
          setSelectedIngredient(null);
          setIngredientAmount('');
        }}
        title="Scale by Ingredient"
      >
        {selectedRecipe && (
          <>
            <Text style={styles.modalLabel}>Select ingredient</Text>
            <ScrollView style={styles.ingredientPickerList}>
              {selectedRecipe.ingredients.map((ing) => (
                <TouchableOpacity
                  key={ing.name}
                  style={[
                    styles.ingredientPickerOption,
                    selectedIngredient?.name === ing.name && styles.ingredientPickerOptionActive,
                  ]}
                  onPress={() => setSelectedIngredient(ing)}
                >
                  <Text style={styles.ingredientPickerName}>{ing.name}</Text>
                  <Text style={styles.ingredientPickerAmount}>
                    {ing.quantity} {ing.unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedIngredient && (
              <>
                <Text style={styles.modalLabel}>
                  How much {selectedIngredient.name.toLowerCase()} do you have?
                </Text>
                <View style={styles.amountInputRow}>
                  <TextInput
                    style={styles.amountInput}
                    value={ingredientAmount}
                    onChangeText={setIngredientAmount}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.dustyMauve}
                  />
                  <Text style={styles.unitLabel}>{selectedIngredient.unit}</Text>
                </View>

                {ingredientAmount && parseFloat(ingredientAmount) > 0 && (
                  <View style={styles.scalePreview}>
                    <Text style={styles.scalePreviewLabel}>Recipe will scale to:</Text>
                    <Text style={styles.scalePreviewValue}>
                      {formatScaleFactor(calculateScaleFromIngredient(
                        selectedIngredient.quantity,
                        parseFloat(ingredientAmount)
                      ))}
                    </Text>
                  </View>
                )}
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowScaleByIngredient(false);
                  setSelectedIngredient(null);
                  setIngredientAmount('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  (!selectedIngredient || !ingredientAmount || parseFloat(ingredientAmount) <= 0) && styles.modalButtonDisabled,
                ]}
                onPress={() => {
                  const scale = calculateScaleFromIngredient(
                    selectedIngredient!.quantity,
                    parseFloat(ingredientAmount)
                  );
                  setViewScale(scale);
                  setShowScaleByIngredient(false);
                  setSelectedIngredient(null);
                  setIngredientAmount('');
                }}
                disabled={!selectedIngredient || !ingredientAmount || parseFloat(ingredientAmount) <= 0}
              >
                <Text style={styles.modalSubmitText}>Apply Scale</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </Modal>

      {/* Scale by Container Modal */}
      {selectedRecipe?.container && item && (
        <ContainerScaleModal
          isOpen={showContainerScale}
          onClose={() => setShowContainerScale(false)}
          onApply={(scaleFactor) => {
            setViewScale(scaleFactor);
          }}
          sourceContainer={selectedRecipe.container}
          recipeId={selectedRecipe.recipeId}
          context={{
            itemName: item.name,
            itemType: item.type as ItemType,
            recipeName: selectedRecipe.name,
            ingredients: selectedRecipe.ingredients,
            bakeTime: selectedRecipe.bakeTime,
            bakeTemp: selectedRecipe.bakeTemp,
            bakeTempUnit: selectedRecipe.bakeTempUnit,
          }}
        />
      )}

      {/* Prep Notes Modal */}
      <Modal
        isOpen={showPrepNotesModal}
        onClose={() => setShowPrepNotesModal(false)}
        title="Preparation Notes"
      >
        <Text style={styles.prepNotesModalText}>{selectedRecipe?.prepNotes}</Text>
      </Modal>
    </View>
  );
}

function VariantsSection({
  itemId,
  recipe,
  onAddVariant,
  onViewVariant,
  onEditVariant,
  onDeleteVariant,
}: {
  itemId: string;
  recipe: Recipe;
  onAddVariant: () => void;
  onViewVariant: (variant: Variant) => void;
  onEditVariant: (variant: Variant) => void;
  onDeleteVariant: (variantId: string) => void;
}) {
  const { data: variants } = useVariants(itemId, recipe.recipeId);

  return (
    <View style={styles.variantsSection}>
      <View style={styles.variantsHeader}>
        <Text style={styles.variantsLabel}>VARIANTS</Text>
        <TouchableOpacity onPress={onAddVariant}>
          <Text style={styles.addLink}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {variants && variants.length > 0 ? (
        <View style={styles.variantsList}>
          {variants.map((variant) => (
            <View key={variant.variantId} style={styles.variantItem}>
              <TouchableOpacity
                style={styles.variantInfo}
                onPress={() => onViewVariant(variant)}
              >
                <Text style={styles.variantName}>{variant.name}</Text>
                {variant.notes && (
                  <Text style={styles.variantNotes} numberOfLines={1}>
                    {variant.notes}
                  </Text>
                )}
              </TouchableOpacity>
              <View style={styles.variantActions}>
                <TouchableOpacity
                  style={styles.variantAction}
                  onPress={() => onEditVariant(variant)}
                >
                  <Icon name="edit" size="sm" color={colors.dustyMauve} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.variantAction}
                  onPress={() => onDeleteVariant(variant.variantId)}
                >
                  <Icon name="delete" size="sm" color={colors.dustyMauve} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noVariants}>No variants yet</Text>
      )}
    </View>
  );
}

function VariantComparisonModal({
  variant,
  recipe,
  viewScale,
  onClose,
}: {
  variant: Variant;
  recipe: Recipe;
  viewScale: number;
  onClose: () => void;
}) {
  const overrideMap = new Map<string, Ingredient>();
  variant.ingredientOverrides.forEach((ing) => overrideMap.set(ing.name, ing));

  const comparisonRows: { name: string; base: Ingredient | null; variant: Ingredient | null }[] = [];

  recipe.ingredients.forEach((ing) => {
    const override = overrideMap.get(ing.name);
    const scaledBase: Ingredient = {
      ...ing,
      quantity: Math.round(ing.quantity * viewScale * 100) / 100,
    };
    const scaledOverride: Ingredient | null = override
      ? { ...override, quantity: Math.round(override.quantity * viewScale * 100) / 100 }
      : null;
    comparisonRows.push({
      name: ing.name,
      base: scaledBase,
      variant: scaledOverride,
    });
    if (override) overrideMap.delete(ing.name);
  });

  overrideMap.forEach((ing) => {
    comparisonRows.push({
      name: ing.name,
      base: null,
      variant: { ...ing, quantity: Math.round(ing.quantity * viewScale * 100) / 100 },
    });
  });

  return (
    <Modal isOpen={true} onClose={onClose} title={variant.name}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.comparisonSubtitle}>
          Changes from <Text style={styles.comparisonBold}>{recipe.name}</Text>
          {viewScale !== 1 && ` (${formatScaleFactor(viewScale)} scale)`}
        </Text>

        <View style={styles.comparisonTable}>
          <View style={styles.comparisonHeader}>
            <Text style={[styles.comparisonHeaderText, { flex: 1 }]}>Ingredient</Text>
            <Text style={[styles.comparisonHeaderText, styles.comparisonCell]}>Base</Text>
            <Text style={[styles.comparisonHeaderText, styles.comparisonCell]}>Variant</Text>
          </View>
          {comparisonRows.map((row) => {
            const isDifferent =
              row.base &&
              row.variant &&
              (row.base.quantity !== row.variant.quantity || row.base.unit !== row.variant.unit);
            const isNew = !row.base && row.variant;

            return (
              <View key={row.name} style={styles.comparisonRow}>
                <Text
                  style={[
                    styles.comparisonName,
                    (isDifferent || isNew) && styles.comparisonHighlight,
                  ]}
                  numberOfLines={1}
                >
                  {row.name}
                </Text>
                <Text style={styles.comparisonValue}>
                  {row.base ? `${row.base.quantity} ${row.base.unit}` : '—'}
                </Text>
                <Text
                  style={[
                    styles.comparisonValue,
                    (isDifferent || isNew) && styles.comparisonHighlight,
                  ]}
                >
                  {row.variant ? `${row.variant.quantity} ${row.variant.unit}` : '(same)'}
                </Text>
              </View>
            );
          })}
        </View>

        {(variant.bakeTime || variant.bakeTemp) && (
          <View style={styles.bakeOverrides}>
            <Text style={styles.bakeOverridesLabel}>BAKE SETTINGS OVERRIDE</Text>
            <View style={styles.bakeOverridesList}>
              {variant.bakeTime && (
                <View style={styles.bakeOverride}>
                  <Icon name="timer" size="sm" color={colors.dustyMauve} />
                  <Text style={styles.bakeOverrideText}>{variant.bakeTime} min</Text>
                  {recipe.bakeTime && (
                    <Text style={styles.bakeOverrideOriginal}>(was {recipe.bakeTime})</Text>
                  )}
                </View>
              )}
              {variant.bakeTemp && (
                <View style={styles.bakeOverride}>
                  <Icon name="thermostat" size="sm" color={colors.dustyMauve} />
                  <Text style={styles.bakeOverrideText}>
                    {variant.bakeTemp}°{variant.bakeTempUnit || 'F'}
                  </Text>
                  {recipe.bakeTemp && (
                    <Text style={styles.bakeOverrideOriginal}>
                      (was {recipe.bakeTemp}°{recipe.bakeTempUnit || 'F'})
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {variant.notes && (
          <View style={styles.variantNotesSection}>
            <Text style={styles.variantNotesLabel}>NOTES</Text>
            <Text style={styles.variantNotesText}>{variant.notes}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
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
    paddingVertical: spacing[3],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing[2],
  },
  headerTitle: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text,
    textAlign: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing[2],
  },
  hero: {
    backgroundColor: 'rgba(244, 172, 183, 0.3)',
    paddingVertical: spacing[8],
    alignItems: 'center',
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  typeLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    textTransform: 'capitalize',
  },
  itemName: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    color: colors.text,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[1],
  },
  itemNotes: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.error,
    padding: spacing[4],
  },
  section: {
    marginTop: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addLink: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  sourceChipsScroll: {
    marginBottom: spacing[2],
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: colors.dustyMauve,
    marginRight: spacing[2],
  },
  sourceChipActive: {
    backgroundColor: colors.dustyMauve,
    borderColor: colors.dustyMauve,
  },
  sourceChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  sourceChipText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
  },
  sourceChipTextActive: {
    color: colors.white,
  },
  chipsScroll: {
    marginBottom: spacing[4],
  },
  chipsContainer: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginRight: spacing[2],
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  chipText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.white,
  },
  subChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  subChipActive: {
    backgroundColor: colors.cardBg,
    borderColor: colors.dustyMauve,
  },
  subChipText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
  },
  subChipTextActive: {
    fontFamily: fontFamily.medium,
    color: colors.text,
  },
  recipeCard: {
    marginHorizontal: spacing[4],
    padding: spacing[5],
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.pastelPink,
    marginBottom: spacing[6],
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  recipeNameColumn: {
    flex: 1,
    gap: spacing[1],
  },
  recipeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  recipeSource: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  recipeName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  bakeSettings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
    marginBottom: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.bgLight,
  },
  bakeSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  bakeSettingText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  // Store-bought styles
  storeBoughtBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeBoughtInfo: {
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.bgLight,
    gap: spacing[3],
  },
  storeBoughtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeBoughtLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  storeBoughtValue: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.text,
  },
  purchasedItemNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.lg,
    alignSelf: 'flex-start',
  },
  purchasedItemNoteText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  scaleSection: {
    flexDirection: 'column',
    marginBottom: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.bgLight,
  },
  scaleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scaleLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: spacing[2],
  },
  scaleButtons: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  scaleButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgLight,
  },
  scaleButtonActive: {
    backgroundColor: colors.primary,
  },
  scaleButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  scaleButtonTextActive: {
    color: colors.white,
  },
  scaleByRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[3],
  },
  scaleByButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(229, 52, 78, 0.08)',
  },
  scaleByText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  customScaleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[2],
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: borderRadius.lg,
    alignSelf: 'flex-start',
  },
  customScaleBadgeText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.success,
  },
  modalLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing[2],
    marginTop: spacing[3],
  },
  ingredientPickerList: {
    maxHeight: 200,
  },
  ingredientPickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[1],
    backgroundColor: colors.bgLight,
  },
  ingredientPickerOptionActive: {
    backgroundColor: 'rgba(229, 52, 78, 0.15)',
  },
  ingredientPickerName: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  ingredientPickerAmount: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  amountInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    fontFamily: fontFamily.medium,
    fontSize: fontSize.lg,
    color: colors.text,
    textAlign: 'center',
  },
  unitLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.dustyMauve,
    minWidth: 40,
  },
  scalePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[4],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
    borderRadius: borderRadius.lg,
  },
  scalePreviewLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  scalePreviewValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalSubmitText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.white,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  ingredients: {
    gap: spacing[3],
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.bgLight,
  },
  ingredientName: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
  },
  ingredientValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  ingredientQty: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  ingredientOriginal: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
  },
  prepNotes: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.bgLight,
  },
  prepNotesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  prepNotesLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  prepNotesText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  prepNotesModalText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
    lineHeight: 24,
  },
  variantsSection: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.bgLight,
  },
  variantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  variantsLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  variantsList: {
    gap: spacing[2],
  },
  variantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.lg,
  },
  variantInfo: {
    flex: 1,
    minWidth: 0,
  },
  variantName: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  variantNotes: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
  },
  variantActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  variantAction: {
    padding: spacing[2],
  },
  noVariants: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: 'rgba(157, 129, 137, 0.7)',
  },
  recipeActions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.bgLight,
  },
  recipeAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
  },
  recipeActionText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyRecipe: {
    marginHorizontal: spacing[4],
    padding: spacing[8],
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.dustyMauve,
    marginBottom: spacing[2],
  },
  actionSheet: {
    gap: spacing[2],
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: borderRadius.xl,
  },
  actionOptionText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.text,
  },
  comparisonSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    marginBottom: spacing[4],
  },
  comparisonBold: {
    fontFamily: fontFamily.bold,
  },
  comparisonTable: {
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  comparisonHeader: {
    flexDirection: 'row',
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: spacing[2],
  },
  comparisonHeaderText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  comparisonCell: {
    width: 70,
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[1],
  },
  comparisonName: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  comparisonValue: {
    width: 70,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
  },
  comparisonHighlight: {
    fontFamily: fontFamily.medium,
    color: colors.primary,
  },
  bakeOverrides: {
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  bakeOverridesLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[3],
  },
  bakeOverridesList: {
    flexDirection: 'row',
    gap: spacing[6],
  },
  bakeOverride: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  bakeOverrideText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  bakeOverrideOriginal: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
  },
  variantNotesSection: {
    marginBottom: spacing[4],
  },
  variantNotesLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[2],
  },
  variantNotesText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  closeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.white,
  },
});
