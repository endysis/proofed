import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useItem, useUpdateItem, useDeleteItem } from '../hooks/useItems';
import { useRecipes, useCreateRecipe, useUpdateRecipe, useDeleteRecipe } from '../hooks/useRecipes';
import { useVariants, useCreateVariant, useUpdateVariant, useDeleteVariant } from '../hooks/useVariants';
import ItemForm from '../components/items/ItemForm';
import RecipeForm from '../components/recipes/RecipeForm';
import VariantForm from '../components/variants/VariantForm';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import Icon from '../components/common/Icon';
import { scaleIngredients, getScaleOptions, formatScaleFactor } from '../utils/scaleRecipe';
import { formatContainer } from '../constants/containers';
import type { Recipe, Variant, Ingredient, CreateItemRequest, CreateRecipeRequest, CreateVariantRequest } from '@proofed/shared';

const typeIcons: Record<string, string> = {
  batter: 'cake',
  frosting: 'water_drop',
  filling: 'icecream',
  dough: 'cookie',
  glaze: 'format_paint',
  other: 'category',
};

export default function ItemDetailPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read query params for deep linking from bake details
  const initialRecipeId = searchParams.get('recipeId');
  const initialScale = searchParams.get('scale');
  const initialVariantId = searchParams.get('variantId');

  const { data: item, isLoading: itemLoading } = useItem(itemId!);
  const { data: recipes, isLoading: recipesLoading } = useRecipes(itemId!);
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant();
  const deleteVariant = useDeleteVariant();

  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(initialRecipeId);
  const [viewScale, setViewScale] = useState(initialScale ? parseFloat(initialScale) : 1);
  const [highlightedVariantId, setHighlightedVariantId] = useState<string | null>(initialVariantId);

  // Set initial recipe selection from query param once recipes load
  useEffect(() => {
    if (recipes && recipes.length > 0 && !selectedRecipeId) {
      if (initialRecipeId && recipes.some(r => r.recipeId === initialRecipeId)) {
        setSelectedRecipeId(initialRecipeId);
      } else {
        setSelectedRecipeId(recipes[0].recipeId);
      }
    }
  }, [recipes, initialRecipeId, selectedRecipeId]);
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

  const handleUpdateItem = (data: CreateItemRequest) => {
    updateItem.mutate({ itemId: itemId!, data }, { onSuccess: () => setEditItemModal(false) });
  };

  const handleDeleteItem = () => {
    if (confirm('Delete this item? All recipes and variants will be deleted.')) {
      deleteItem.mutate(itemId!, { onSuccess: () => navigate('/items') });
    }
  };

  const handleCreateRecipe = (data: CreateRecipeRequest) => {
    createRecipe.mutate({ itemId: itemId!, data }, { onSuccess: () => setRecipeModal({ isOpen: false }) });
  };

  const handleUpdateRecipe = (data: CreateRecipeRequest) => {
    if (recipeModal.recipe) {
      updateRecipe.mutate(
        { itemId: itemId!, recipeId: recipeModal.recipe.recipeId, data },
        { onSuccess: () => setRecipeModal({ isOpen: false }) }
      );
    }
  };

  const handleDeleteRecipe = (recipeId: string) => {
    if (confirm('Delete this recipe and all its variants?')) {
      deleteRecipe.mutate({ itemId: itemId!, recipeId });
    }
  };

  const handleCreateVariant = (data: CreateVariantRequest) => {
    if (variantModal.recipeId) {
      createVariant.mutate(
        { itemId: itemId!, recipeId: variantModal.recipeId, data },
        { onSuccess: () => setVariantModal({ isOpen: false }) }
      );
    }
  };

  const handleUpdateVariant = (data: CreateVariantRequest) => {
    if (variantModal.variant && variantModal.recipeId) {
      updateVariant.mutate(
        {
          itemId: itemId!,
          recipeId: variantModal.recipeId,
          variantId: variantModal.variant.variantId,
          data,
        },
        { onSuccess: () => setVariantModal({ isOpen: false }) }
      );
    }
  };

  const handleDeleteVariant = (recipeId: string, variantId: string) => {
    if (confirm('Delete this variant?')) {
      deleteVariant.mutate({ itemId: itemId!, recipeId, variantId });
    }
  };

  if (itemLoading || recipesLoading) return <Loading />;
  if (!item) return <div className="text-red-500 p-4">Item not found</div>;

  const selectedRecipe = recipes?.find(r => r.recipeId === selectedRecipeId) || recipes?.[0];

  return (
    <div className="pb-4">
      {/* Top App Bar */}
      <div className="sticky top-0 z-10 flex items-center bg-white p-4 pb-2 justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-[#171112] flex size-12 shrink-0 items-center"
        >
          <Icon name="arrow_back_ios" />
        </button>
        <h2 className="text-[#171112] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Recipe Log</h2>
        <button
          onClick={() => setShowActions(true)}
          className="flex size-12 items-center justify-end"
        >
          <Icon name="more_vert" className="text-[#171112]" />
        </button>
      </div>

      {/* Header Image Area */}
      <div className="w-full bg-pastel-pink/30 min-h-48 flex flex-col items-center justify-center">
        <div className="text-primary flex items-center justify-center rounded-full bg-primary/10 size-20 mb-2">
          <Icon name={typeIcons[item.type] || 'category'} size="xl" />
        </div>
        <span className="text-sm text-dusty-mauve capitalize">{item.type}</span>
      </div>

      {/* Headline */}
      <h2 className="text-[#171112] tracking-tight text-[28px] font-bold leading-tight px-4 text-left pb-1 pt-5">
        {item.name}
      </h2>

      {/* Meta */}
      {item.notes && (
        <p className="text-dusty-mauve text-sm font-medium leading-normal pb-3 pt-1 px-4">
          {item.notes}
        </p>
      )}

      {/* Recipes Section */}
      <div className="mt-4">
        <div className="flex items-center justify-between px-4 pb-3">
          <h3 className="section-title">Recipes</h3>
          <button
            onClick={() => setRecipeModal({ isOpen: true })}
            className="text-primary text-sm font-bold"
          >
            Add New
          </button>
        </div>

        {/* Recipe Chips */}
        {recipes && recipes.length > 0 && (
          <div className="flex gap-2 px-4 pb-4 overflow-x-auto no-scrollbar">
            {recipes.map((recipe) => (
              <button
                key={recipe.recipeId}
                onClick={() => setSelectedRecipeId(recipe.recipeId)}
                className={`chip flex-none ${
                  selectedRecipe?.recipeId === recipe.recipeId ? 'chip-active' : 'chip-inactive'
                }`}
              >
                {recipe.name}
              </button>
            ))}
          </div>
        )}

        {/* Selected Recipe Card */}
        {selectedRecipe ? (
          <div className="mx-4 p-5 bg-white rounded-xl border border-pastel-pink shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-lg text-[#171112]">{selectedRecipe.name}</h4>
              <button
                onClick={() => setRecipeModal({ isOpen: true, recipe: selectedRecipe })}
                className="text-dusty-mauve"
              >
                <Icon name="edit" size="sm" />
              </button>
            </div>

            {/* Bake Settings & Container */}
            {(selectedRecipe.bakeTime || selectedRecipe.bakeTemp || selectedRecipe.container) && (
              <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-bg-light">
                {selectedRecipe.bakeTime && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Icon name="timer" size="sm" className="text-dusty-mauve" />
                    <span className="font-medium">{selectedRecipe.bakeTime} min</span>
                  </div>
                )}
                {selectedRecipe.bakeTemp && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Icon name="thermostat" size="sm" className="text-dusty-mauve" />
                    <span className="font-medium">{selectedRecipe.bakeTemp}°{selectedRecipe.bakeTempUnit || 'F'}</span>
                  </div>
                )}
                {selectedRecipe.container && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Icon name="cake" size="sm" className="text-dusty-mauve" />
                    <span className="font-medium">
                      {formatContainer(
                        selectedRecipe.container.type,
                        selectedRecipe.container.size,
                        selectedRecipe.container.count,
                        viewScale
                      )}
                    </span>
                    {viewScale !== 1 && (
                      <span className="text-xs text-dusty-mauve font-normal">
                        (was {selectedRecipe.container.count})
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Scale Selector */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-bg-light">
              <span className="text-xs font-bold text-dusty-mauve uppercase tracking-wider">Scale:</span>
              <div className="flex gap-1 flex-wrap">
                {getScaleOptions(selectedRecipe.customScales).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setViewScale(option.value)}
                    className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-colors ${
                      viewScale === option.value
                        ? 'bg-primary text-white'
                        : 'bg-bg-light text-dusty-mauve hover:bg-pastel-pink'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-3">
              {scaleIngredients(selectedRecipe.ingredients, viewScale).map((ing, i) => (
                <div key={i} className="flex justify-between items-center border-b border-bg-light pb-2">
                  <span className="text-sm font-medium">{ing.name}</span>
                  <span className="text-sm font-bold">
                    {ing.quantity} {ing.unit}
                    {viewScale !== 1 && (
                      <span className="text-xs text-dusty-mauve font-normal ml-1">
                        (was {selectedRecipe.ingredients[i].quantity})
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {selectedRecipe.prepNotes && (
              <div className="mt-4 pt-4 border-t border-bg-light">
                <p className="text-xs font-bold text-dusty-mauve uppercase tracking-wider mb-2">Prep Notes</p>
                <p className="text-sm text-[#171112]/80 whitespace-pre-wrap">{selectedRecipe.prepNotes}</p>
              </div>
            )}

            {/* Variants Section */}
            <VariantsSection
              itemId={itemId!}
              recipe={selectedRecipe}
              highlightedVariantId={highlightedVariantId}
              onAddVariant={() => setVariantModal({ isOpen: true, recipeId: selectedRecipe.recipeId })}
              onViewVariant={(variant) => {
                setHighlightedVariantId(null);
                setViewVariantModal({ variant, recipe: selectedRecipe });
              }}
              onEditVariant={(variant) => setVariantModal({ isOpen: true, recipeId: selectedRecipe.recipeId, variant })}
              onDeleteVariant={(variantId) => handleDeleteVariant(selectedRecipe.recipeId, variantId)}
            />

            <div className="flex gap-2 mt-4 pt-4 border-t border-bg-light">
              <button
                onClick={() => setRecipeModal({ isOpen: true, recipe: selectedRecipe })}
                className="flex-1 py-2 text-xs font-bold text-primary uppercase tracking-wider flex items-center justify-center gap-1"
              >
                <Icon name="edit" size="sm" /> Edit Recipe
              </button>
              <button
                onClick={() => handleDeleteRecipe(selectedRecipe.recipeId)}
                className="flex-1 py-2 text-xs font-bold text-dusty-mauve uppercase tracking-wider flex items-center justify-center gap-1"
              >
                <Icon name="delete" size="sm" /> Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-4 p-8 bg-white rounded-xl border border-black/5 text-center">
            <p className="text-dusty-mauve mb-2">No recipes yet</p>
            <button
              onClick={() => setRecipeModal({ isOpen: true })}
              className="text-primary font-bold text-sm"
            >
              Add your first recipe
            </button>
          </div>
        )}
      </div>

      {/* Action sheet */}
      <Modal isOpen={showActions} onClose={() => setShowActions(false)} title="Item Actions">
        <div className="space-y-2">
          <button
            onClick={() => {
              setShowActions(false);
              setEditItemModal(true);
            }}
            className="w-full p-4 text-left active:bg-gray-50 rounded-xl flex items-center gap-3"
          >
            <Icon name="edit" className="text-dusty-mauve" />
            <span className="font-medium">Edit Item</span>
          </button>
          <button
            onClick={() => {
              setShowActions(false);
              handleDeleteItem();
            }}
            className="w-full p-4 text-left text-primary active:bg-red-50 rounded-xl flex items-center gap-3"
          >
            <Icon name="delete" className="text-primary" />
            <span className="font-medium">Delete Item</span>
          </button>
        </div>
      </Modal>

      <Modal isOpen={editItemModal} onClose={() => setEditItemModal(false)} title="Edit Item">
        <ItemForm
          item={item}
          onSubmit={handleUpdateItem}
          onCancel={() => setEditItemModal(false)}
          isLoading={updateItem.isPending}
        />
      </Modal>

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
    </div>
  );
}

function VariantsSection({
  itemId,
  recipe,
  highlightedVariantId,
  onAddVariant,
  onViewVariant,
  onEditVariant,
  onDeleteVariant,
}: {
  itemId: string;
  recipe: Recipe;
  highlightedVariantId: string | null;
  onAddVariant: () => void;
  onViewVariant: (variant: Variant) => void;
  onEditVariant: (variant: Variant) => void;
  onDeleteVariant: (variantId: string) => void;
}) {
  const { data: variants } = useVariants(itemId, recipe.recipeId);

  return (
    <div className="mt-4 pt-4 border-t border-bg-light">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-dusty-mauve uppercase tracking-wider">Variants</p>
        <button onClick={onAddVariant} className="text-primary text-xs font-bold">
          + Add
        </button>
      </div>

      {variants && variants.length > 0 ? (
        <div className="space-y-2">
          {variants.map((variant) => {
            const isHighlighted = variant.variantId === highlightedVariantId;
            return (
              <div
                key={variant.variantId}
                className={`flex items-center justify-between rounded-lg p-3 transition-colors ${
                  isHighlighted
                    ? 'bg-primary/10 ring-2 ring-primary'
                    : 'bg-bg-light'
                }`}
              >
                <button
                  onClick={() => onViewVariant(variant)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className={`font-medium text-sm ${isHighlighted ? 'text-primary' : 'text-[#171112]'}`}>
                    {variant.name}
                    {isHighlighted && <span className="ml-2 text-xs">(selected)</span>}
                  </p>
                  {variant.notes && (
                    <p className="text-xs text-dusty-mauve line-clamp-1">{variant.notes}</p>
                  )}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditVariant(variant)}
                    className="p-2 text-dusty-mauve"
                  >
                    <Icon name="edit" size="sm" />
                  </button>
                  <button
                    onClick={() => onDeleteVariant(variant.variantId)}
                    className="p-2 text-dusty-mauve"
                  >
                    <Icon name="delete" size="sm" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-dusty-mauve/70">No variants yet</p>
      )}
    </div>
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
  // Build a map of variant ingredient overrides
  const overrideMap = new Map<string, Ingredient>();
  variant.ingredientOverrides.forEach((ing) => overrideMap.set(ing.name, ing));

  // Merge base recipe with variant overrides, scaling quantities by viewScale
  const comparisonRows: { name: string; base: Ingredient | null; variant: Ingredient | null }[] = [];

  // Add all base ingredients (scaled)
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

  // Add any new ingredients only in variant (scaled)
  overrideMap.forEach((ing) => {
    comparisonRows.push({
      name: ing.name,
      base: null,
      variant: { ...ing, quantity: Math.round(ing.quantity * viewScale * 100) / 100 },
    });
  });

  return (
    <Modal isOpen={true} onClose={onClose} title={`${variant.name}`}>
      <div className="space-y-4">
        <p className="text-sm text-dusty-mauve">
          Changes from <span className="font-bold">{recipe.name}</span>
          {viewScale !== 1 && <span className="ml-1">({formatScaleFactor(viewScale)} scale)</span>}
        </p>
        <div className="bg-bg-light rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-xs font-bold text-dusty-mauve uppercase tracking-wider pb-2 border-b border-black/10">
            <div>Ingredient</div>
            <div className="text-center">Base</div>
            <div className="text-center">Variant</div>
          </div>
          {comparisonRows.map((row) => {
            const isDifferent = row.base && row.variant &&
              (row.base.quantity !== row.variant.quantity || row.base.unit !== row.variant.unit);
            const isNew = !row.base && row.variant;

            return (
              <div
                key={row.name}
                className={`grid grid-cols-3 gap-2 text-sm py-1 ${
                  isDifferent || isNew ? 'text-primary font-medium' : ''
                }`}
              >
                <div className="truncate">{row.name}</div>
                <div className="text-center">
                  {row.base ? `${row.base.quantity} ${row.base.unit}` : '—'}
                </div>
                <div className="text-center">
                  {row.variant ? `${row.variant.quantity} ${row.variant.unit}` : '(same)'}
                </div>
              </div>
            );
          })}
        </div>
        {/* Bake Settings Overrides */}
        {(variant.bakeTime || variant.bakeTemp) && (
          <div className="bg-bg-light rounded-xl p-4">
            <p className="text-xs font-bold text-dusty-mauve uppercase tracking-wider mb-3">Bake Settings Override</p>
            <div className="flex gap-6">
              {variant.bakeTime && (
                <div className="flex items-center gap-2 text-sm">
                  <Icon name="timer" size="sm" className="text-dusty-mauve" />
                  <span className="font-medium">{variant.bakeTime} min</span>
                  {recipe.bakeTime && (
                    <span className="text-xs text-dusty-mauve">(was {recipe.bakeTime})</span>
                  )}
                </div>
              )}
              {variant.bakeTemp && (
                <div className="flex items-center gap-2 text-sm">
                  <Icon name="thermostat" size="sm" className="text-dusty-mauve" />
                  <span className="font-medium">{variant.bakeTemp}°{variant.bakeTempUnit || 'F'}</span>
                  {recipe.bakeTemp && (
                    <span className="text-xs text-dusty-mauve">(was {recipe.bakeTemp}°{recipe.bakeTempUnit || 'F'})</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {variant.notes && (
          <div>
            <p className="text-xs font-bold text-dusty-mauve uppercase tracking-wider mb-2">Notes</p>
            <p className="text-sm text-[#171112]/80">{variant.notes}</p>
          </div>
        )}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
