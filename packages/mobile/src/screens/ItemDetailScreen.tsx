import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Icon, Modal, Loading, Badge } from '../components/common';
import { ItemForm } from '../components/items';
import { RecipeForm } from '../components/recipes';
import { VariantForm } from '../components/variants';
import { useItem, useUpdateItem, useDeleteItem } from '../hooks/useItems';
import { useRecipes, useCreateRecipe, useUpdateRecipe, useDeleteRecipe } from '../hooks/useRecipes';
import { useVariants, useCreateVariant, useUpdateVariant, useDeleteVariant } from '../hooks/useVariants';
import { scaleIngredients, getScaleOptions, formatScaleFactor } from '../utils/scaleRecipe';
import { formatContainer } from '../constants/containers';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { Recipe, Variant, Ingredient, CreateItemRequest, CreateRecipeRequest, CreateVariantRequest } from '@proofed/shared';

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

  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [viewScale, setViewScale] = useState(1);
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

  useEffect(() => {
    if (recipes && recipes.length > 0 && !selectedRecipeId) {
      setSelectedRecipeId(recipes[0].recipeId);
    }
  }, [recipes, selectedRecipeId]);

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
        <Text style={styles.headerTitle}>Recipe Log</Text>
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

          {/* Recipe Chips */}
          {recipes && recipes.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
              contentContainerStyle={styles.chipsContainer}
            >
              {recipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.recipeId}
                  style={[
                    styles.chip,
                    selectedRecipe?.recipeId === recipe.recipeId && styles.chipActive,
                  ]}
                  onPress={() => setSelectedRecipeId(recipe.recipeId)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedRecipe?.recipeId === recipe.recipeId && styles.chipTextActive,
                    ]}
                  >
                    {recipe.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Selected Recipe Card */}
          {selectedRecipe ? (
            <View style={styles.recipeCard}>
              <View style={styles.recipeHeader}>
                <Text style={styles.recipeName}>{selectedRecipe.name}</Text>
                <TouchableOpacity
                  onPress={() => setRecipeModal({ isOpen: true, recipe: selectedRecipe })}
                >
                  <Icon name="edit" size="sm" color={colors.dustyMauve} />
                </TouchableOpacity>
              </View>

              {/* Bake Settings */}
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
                          selectedRecipe.container.size,
                          selectedRecipe.container.count,
                          viewScale
                        )}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Scale Selector */}
              <View style={styles.scaleSection}>
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

              {/* Ingredients */}
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

              {/* Prep Notes */}
              {selectedRecipe.prepNotes && (
                <View style={styles.prepNotes}>
                  <Text style={styles.prepNotesLabel}>PREP NOTES</Text>
                  <Text style={styles.prepNotesText}>{selectedRecipe.prepNotes}</Text>
                </View>
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
          recipe={recipeModal.recipe}
          onSubmit={recipeModal.recipe ? handleUpdateRecipe : handleCreateRecipe}
          onCancel={() => setRecipeModal({ isOpen: false })}
          isLoading={createRecipe.isPending || updateRecipe.isPending}
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
  chipText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.white,
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
  scaleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.bgLight,
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
  prepNotesLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[2],
  },
  prepNotesText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
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
