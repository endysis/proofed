import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProofedItem, useUpdateProofedItem, useDeleteProofedItem } from '../hooks/useProofedItems';
import { useItem } from '../hooks/useItems';
import { useRecipe } from '../hooks/useRecipes';
import { useVariant } from '../hooks/useVariants';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import Icon from '../components/common/Icon';
import type { ItemUsage } from '@proofed/shared';

export default function ProofedItemDetailPage() {
  const { proofedItemId } = useParams<{ proofedItemId: string }>();
  const navigate = useNavigate();

  const { data: proofedItem, isLoading } = useProofedItem(proofedItemId!);
  const updateProofedItem = useUpdateProofedItem();
  const deleteProofedItem = useDeleteProofedItem();

  const [showActions, setShowActions] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const handleDelete = () => {
    if (confirm('Delete this proofed item?')) {
      deleteProofedItem.mutate(proofedItemId!, { onSuccess: () => navigate('/proofed') });
    }
  };

  const handleSave = () => {
    updateProofedItem.mutate(
      { proofedItemId: proofedItemId!, data: { name: editName, notes: editNotes || undefined } },
      { onSuccess: () => setEditModal(false) }
    );
  };

  if (isLoading) return <Loading />;
  if (!proofedItem) return <div className="text-red-500 p-4">Proofed item not found</div>;

  return (
    <div className="pb-4">
      {/* Top App Bar */}
      <div className="sticky top-0 z-10 flex items-center bg-white p-4 pb-2 justify-between">
        <Link to="/proofed" className="text-[#171112] flex size-12 shrink-0 items-center">
          <Icon name="arrow_back_ios" />
        </Link>
        <h2 className="text-[#171112] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          Proofed Recipe
        </h2>
        <button
          onClick={() => setShowActions(true)}
          className="flex size-12 items-center justify-end"
        >
          <Icon name="more_vert" className="text-[#171112]" />
        </button>
      </div>

      {/* Header Banner */}
      <div className="w-full bg-gradient-to-br from-primary/10 to-pastel-pink/30 min-h-32 flex flex-col items-center justify-center py-8">
        <div className="text-primary flex items-center justify-center rounded-full bg-white size-16 shadow-sm mb-3">
          <Icon name="verified" size="xl" />
        </div>
        <span className="text-xs text-primary font-bold uppercase tracking-wider bg-white/80 px-3 py-1 rounded-full">
          Proven Recipe
        </span>
      </div>

      {/* Title */}
      <div className="px-4 pt-5">
        <h1 className="text-[28px] font-bold text-[#171112] leading-tight">{proofedItem.name}</h1>
        {proofedItem.notes && (
          <p className="text-dusty-mauve text-sm mt-2">{proofedItem.notes}</p>
        )}
        <p className="text-xs text-dusty-mauve mt-2 flex items-center gap-1">
          <Icon name="calendar_today" size="sm" />
          Created {new Date(proofedItem.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Item Configuration */}
      <div className="mt-6 px-4">
        <h3 className="section-title mb-3">Recipe Configuration</h3>
        <p className="text-xs text-dusty-mauve mb-4">
          The proven item + recipe + variant combinations
        </p>
        <div className="space-y-3">
          {proofedItem.itemConfigs.map((config, index) => (
            <ItemConfigDisplay key={index} config={config} />
          ))}
        </div>
      </div>

      {/* Link to original attempt */}
      {proofedItem.capturedFromAttemptId && (
        <div className="mt-6 px-4">
          <Link
            to={`/attempts/${proofedItem.capturedFromAttemptId}`}
            className="block bg-white rounded-xl border border-black/5 shadow-sm p-4 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-dusty-mauve flex items-center justify-center rounded-lg bg-dusty-mauve/10 size-10">
                  <Icon name="history" size="sm" />
                </div>
                <div>
                  <p className="font-medium text-[#171112] text-sm">View Original Attempt</p>
                  <p className="text-xs text-dusty-mauve">See the bake that created this</p>
                </div>
              </div>
              <Icon name="chevron_right" className="text-dusty-mauve" />
            </div>
          </Link>
        </div>
      )}

      {/* Action Sheet */}
      <Modal isOpen={showActions} onClose={() => setShowActions(false)} title="Actions">
        <div className="space-y-2">
          <button
            onClick={() => {
              setShowActions(false);
              setEditName(proofedItem.name);
              setEditNotes(proofedItem.notes || '');
              setEditModal(true);
            }}
            className="w-full p-4 text-left active:bg-gray-50 rounded-xl flex items-center gap-3"
          >
            <Icon name="edit" className="text-dusty-mauve" />
            <span className="font-medium">Edit</span>
          </button>
          <button
            onClick={() => {
              setShowActions(false);
              handleDelete();
            }}
            className="w-full p-4 text-left text-primary active:bg-red-50 rounded-xl flex items-center gap-3"
          >
            <Icon name="delete" className="text-primary" />
            <span className="font-medium">Delete</span>
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Proofed Item">
        <div className="space-y-4">
          <div>
            <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Name</p>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
              className="w-full rounded-xl border border-black/10 bg-white h-14 px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Notes</p>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Why does this combination work?"
              rows={4}
              className="w-full rounded-xl border border-black/10 bg-white p-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setEditModal(false)}
              className="flex-1 py-3 rounded-xl border border-black/10 font-bold text-[#171112]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editName.trim() || updateProofedItem.isPending}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ItemConfigDisplay({ config }: { config: ItemUsage }) {
  const { data: item } = useItem(config.itemId);
  const { data: recipe } = useRecipe(config.itemId, config.recipeId);
  const { data: variant } = useVariant(
    config.itemId,
    config.recipeId,
    config.variantId || ''
  );
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
      <button
        className="w-full p-4 text-left active:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-10">
              <Icon name="cake" size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#171112] text-sm">{item?.name || 'Loading...'}</p>
              <p className="text-xs text-dusty-mauve">
                {recipe?.name || 'Loading...'}
                {variant && <span className="text-primary font-medium"> • {variant.name}</span>}
              </p>
            </div>
          </div>
          <Icon
            name={expanded ? 'expand_less' : 'expand_more'}
            className="text-dusty-mauve"
          />
        </div>
        {config.notes && (
          <p className="text-xs text-dusty-mauve mt-2 ml-13">{config.notes}</p>
        )}
      </button>

      {expanded && recipe && (
        <div className="border-t border-bg-light p-4 bg-bg-light/50">
          <p className="text-xs font-bold text-dusty-mauve uppercase tracking-wider mb-3">Ingredients</p>
          <div className="space-y-2">
            {recipe.ingredients.map((ing, i) => {
              const override = variant?.ingredientOverrides.find(
                (o) => o.name.toLowerCase() === ing.name.toLowerCase()
              );
              return (
                <div key={i} className="flex justify-between items-center">
                  <span className={`text-sm ${override ? 'text-primary font-medium' : 'text-[#171112]'}`}>
                    {ing.name}
                    {override && ' *'}
                  </span>
                  <span className="text-sm font-bold">
                    {override ? override.quantity : ing.quantity} {override ? override.unit : ing.unit}
                  </span>
                </div>
              );
            })}
          </div>
          {variant && variant.ingredientOverrides.length > 0 && (
            <p className="text-xs text-primary mt-3">* Modified from base recipe</p>
          )}
        </div>
      )}
    </div>
  );
}
