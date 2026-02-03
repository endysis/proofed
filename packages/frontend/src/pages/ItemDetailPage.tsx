import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useItem, useUpdateItem, useDeleteItem } from '../hooks/useItems';
import { useRecipes, useCreateRecipe, useUpdateRecipe, useDeleteRecipe } from '../hooks/useRecipes';
import { useVariants, useCreateVariant, useUpdateVariant, useDeleteVariant } from '../hooks/useVariants';
import ItemForm from '../components/items/ItemForm';
import RecipeForm from '../components/recipes/RecipeForm';
import VariantForm from '../components/variants/VariantForm';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import Icon from '../components/common/Icon';
import type { Recipe, Variant, CreateItemRequest, CreateRecipeRequest, CreateVariantRequest } from '@proofed/shared';

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

  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [editItemModal, setEditItemModal] = useState(false);
  const [recipeModal, setRecipeModal] = useState<{ isOpen: boolean; recipe?: Recipe }>({ isOpen: false });
  const [variantModal, setVariantModal] = useState<{
    isOpen: boolean;
    recipeId?: string;
    variant?: Variant;
  }>({ isOpen: false });
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
        <Link to="/" className="text-[#171112] flex size-12 shrink-0 items-center">
          <Icon name="arrow_back_ios" />
        </Link>
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
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-lg text-[#171112]">{selectedRecipe.name}</h4>
              <button
                onClick={() => setRecipeModal({ isOpen: true, recipe: selectedRecipe })}
                className="text-dusty-mauve"
              >
                <Icon name="edit" size="sm" />
              </button>
            </div>

            {/* Ingredients */}
            <div className="space-y-3">
              {selectedRecipe.ingredients.map((ing, i) => (
                <div key={i} className="flex justify-between items-center border-b border-bg-light pb-2">
                  <span className="text-sm font-medium">{ing.name}</span>
                  <span className="text-sm font-bold">{ing.quantity} {ing.unit}</span>
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
              onAddVariant={() => setVariantModal({ isOpen: true, recipeId: selectedRecipe.recipeId })}
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
          onSubmit={variantModal.variant ? handleUpdateVariant : handleCreateVariant}
          onCancel={() => setVariantModal({ isOpen: false })}
          isLoading={createVariant.isPending || updateVariant.isPending}
        />
      </Modal>
    </div>
  );
}

function VariantsSection({
  itemId,
  recipe,
  onAddVariant,
  onEditVariant,
  onDeleteVariant,
}: {
  itemId: string;
  recipe: Recipe;
  onAddVariant: () => void;
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
          {variants.map((variant) => (
            <div
              key={variant.variantId}
              className="flex items-center justify-between bg-bg-light rounded-lg p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[#171112]">{variant.name}</p>
                {variant.notes && (
                  <p className="text-xs text-dusty-mauve line-clamp-1">{variant.notes}</p>
                )}
              </div>
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
          ))}
        </div>
      ) : (
        <p className="text-sm text-dusty-mauve/70">No variants yet</p>
      )}
    </div>
  );
}
