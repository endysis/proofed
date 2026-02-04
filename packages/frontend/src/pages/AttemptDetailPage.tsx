import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAttempt, useUpdateAttempt, useDeleteAttempt, useCaptureAttempt } from '../hooks/useAttempts';
import { useItems, useItem } from '../hooks/useItems';
import { useRecipes, useRecipe } from '../hooks/useRecipes';
import { useVariants, useVariant } from '../hooks/useVariants';
import { usePhotoUpload, usePhotoUrl } from '../hooks/usePhotos';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import Icon from '../components/common/Icon';
import PhotoUpload from '../components/photos/PhotoUpload';
import { formatScaleFactor, getScaleOptions } from '../utils/scaleRecipe';
import { formatContainer } from '../constants/containers';
import type { ItemUsage } from '@proofed/shared';

export default function AttemptDetailPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const { data: attempt, isLoading } = useAttempt(attemptId!);
  const updateAttempt = useUpdateAttempt();
  const deleteAttempt = useDeleteAttempt();
  const captureAttempt = useCaptureAttempt();
  const photoUpload = usePhotoUpload();

  const [showActions, setShowActions] = useState(false);
  const [outcomeModal, setOutcomeModal] = useState(false);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [captureModal, setCaptureModal] = useState(false);
  const [captureName, setCaptureName] = useState('');
  const [captureNotes, setCaptureNotes] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editDateModal, setEditDateModal] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editNameModal, setEditNameModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editItemsModal, setEditItemsModal] = useState(false);

  const handleDelete = () => {
    if (confirm('Delete this attempt?')) {
      deleteAttempt.mutate(attemptId!, { onSuccess: () => navigate('/attempts') });
    }
  };

  const handleSaveOutcome = () => {
    updateAttempt.mutate(
      { attemptId: attemptId!, data: { outcomeNotes } },
      { onSuccess: () => setOutcomeModal(false) }
    );
  };

  const handleCapture = () => {
    captureAttempt.mutate(
      { attemptId: attemptId!, data: { name: captureName, notes: captureNotes || undefined } },
      {
        onSuccess: (proofedItem) => {
          setCaptureModal(false);
          navigate(`/proofed/${proofedItem.proofedItemId}`);
        },
      }
    );
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      const key = await photoUpload.mutateAsync({ attemptId: attemptId!, file });
      const photoKeys = [...(attempt?.photoKeys || []), key];
      updateAttempt.mutate({ attemptId: attemptId!, data: { photoKeys } });
    } catch (error) {
      console.error('Failed to upload photo:', error);
    }
  };

  const handleRemovePhoto = (keyToRemove: string) => {
    if (confirm('Remove this photo?')) {
      const photoKeys = (attempt?.photoKeys || []).filter(key => key !== keyToRemove);
      const mainPhotoKey = attempt?.mainPhotoKey === keyToRemove ? undefined : attempt?.mainPhotoKey;
      updateAttempt.mutate({ attemptId: attemptId!, data: { photoKeys, mainPhotoKey } });
    }
  };

  const handleSetMainPhoto = (key: string) => {
    const mainPhotoKey = attempt?.mainPhotoKey === key ? undefined : key;
    updateAttempt.mutate({ attemptId: attemptId!, data: { mainPhotoKey } });
  };

  const handleSaveDate = () => {
    updateAttempt.mutate(
      { attemptId: attemptId!, data: { date: editDate } },
      { onSuccess: () => setEditDateModal(false) }
    );
  };

  const handleSaveName = () => {
    updateAttempt.mutate(
      { attemptId: attemptId!, data: { name: editName } },
      { onSuccess: () => setEditNameModal(false) }
    );
  };

  if (isLoading) return <Loading />;
  if (!attempt) return <div className="text-red-500 p-4">Attempt not found</div>;

  return (
    <div className="pb-44">
      {/* Top App Bar */}
      <div className="sticky top-0 z-10 flex items-center bg-white p-4 pb-2 justify-between">
        <Link to="/attempts" className="text-[#171112] flex size-12 shrink-0 items-center">
          <Icon name="arrow_back_ios" />
        </Link>
        <h2 className="text-[#171112] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          Bake Details
        </h2>
        <button
          onClick={() => setShowActions(true)}
          className="flex size-12 items-center justify-end"
        >
          <Icon name="more_vert" className="text-[#171112]" />
        </button>
      </div>

      {/* Header */}
      <div className="px-4 pt-4">
        <button
          onClick={() => {
            setEditName(attempt.name);
            setEditNameModal(true);
          }}
          className="text-[28px] font-bold text-[#171112] leading-tight text-left flex items-center gap-2 active:text-primary transition-colors"
        >
          {attempt.name}
          <Icon name="edit" size="sm" className="text-dusty-mauve" />
        </button>
        <button
          onClick={() => {
            setEditDate(attempt.date);
            setEditDateModal(true);
          }}
          className="text-dusty-mauve text-sm mt-1 flex items-center gap-2 active:text-primary transition-colors"
        >
          <Icon name="calendar_today" size="sm" />
          {new Date(attempt.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
          <Icon name="edit" size="sm" className="ml-1" />
        </button>
      </div>

      {/* Notes */}
      {attempt.notes && (
        <div className="mt-6 px-4">
          <h3 className="section-title mb-3">Notes</h3>
          <div className="bg-white rounded-xl border border-black/5 shadow-sm p-4">
            <p className="text-sm text-[#171112]/80 whitespace-pre-wrap">{attempt.notes}</p>
          </div>
        </div>
      )}

      {/* Items Used */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title">Items Used</h3>
          <button
            onClick={() => setEditItemsModal(true)}
            className="text-primary text-sm font-bold"
          >
            Edit
          </button>
        </div>
        <div className="space-y-2">
          {attempt.itemUsages.map((usage, index) => (
            <ItemUsageDisplay
              key={index}
              usage={usage}
            />
          ))}
          {attempt.itemUsages.length === 0 && (
            <div className="bg-white rounded-xl border border-black/5 p-4 text-center">
              <p className="text-sm text-dusty-mauve">No items recorded</p>
            </div>
          )}
        </div>
      </div>

      {/* Outcome */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title">Outcome</h3>
          <button
            onClick={() => {
              setOutcomeNotes(attempt.outcomeNotes || '');
              setOutcomeModal(true);
            }}
            className="text-primary text-sm font-bold"
          >
            {attempt.outcomeNotes ? 'Edit' : '+ Add'}
          </button>
        </div>
        <div className="bg-white rounded-xl border border-black/5 shadow-sm p-4">
          {attempt.outcomeNotes ? (
            <p className="text-sm text-[#171112]/80 whitespace-pre-wrap">{attempt.outcomeNotes}</p>
          ) : (
            <p className="text-sm text-dusty-mauve text-center py-2">No outcome logged yet</p>
          )}
        </div>
      </div>

      {/* Photos */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title">Photos</h3>
          <PhotoUpload onUpload={handlePhotoUpload} isLoading={photoUpload.isPending} />
        </div>
        {attempt.photoKeys && attempt.photoKeys.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {attempt.photoKeys.map((key, index) => (
              <PhotoThumbnail
                key={index}
                photoKey={key}
                isMain={attempt.mainPhotoKey === key}
                onTap={() => setLightboxIndex(index)}
                onRemove={() => handleRemovePhoto(key)}
                onSetMain={() => handleSetMainPhoto(key)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border-2 border-dashed border-pastel-pink p-8 text-center">
            <Icon name="add_a_photo" size="xl" className="text-dusty-mauve mb-2" />
            <p className="text-dusty-mauve text-sm">No photos yet</p>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-bg-light border-t border-black/5">
        <button
          onClick={() => {
            setCaptureName(attempt.name);
            setCaptureModal(true);
          }}
          className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Icon name="verified" />
          Capture as Proofed
        </button>
      </div>

      {/* Action Sheet */}
      <Modal isOpen={showActions} onClose={() => setShowActions(false)} title="Actions">
        <div className="space-y-2">
          <button
            onClick={() => {
              setShowActions(false);
              handleDelete();
            }}
            className="w-full p-4 text-left text-primary active:bg-red-50 rounded-xl flex items-center gap-3"
          >
            <Icon name="delete" className="text-primary" />
            <span className="font-medium">Delete Attempt</span>
          </button>
        </div>
      </Modal>

      {/* Outcome Modal */}
      <Modal isOpen={outcomeModal} onClose={() => setOutcomeModal(false)} title="Log Outcome">
        <div className="space-y-4">
          <div>
            <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Outcome Notes</p>
            <textarea
              value={outcomeNotes}
              onChange={(e) => setOutcomeNotes(e.target.value)}
              placeholder="What worked? What didn't? What would you change?"
              rows={6}
              autoFocus
              className="w-full rounded-xl border border-black/10 bg-white p-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setOutcomeModal(false)}
              className="flex-1 py-3 rounded-xl border border-black/10 font-bold text-[#171112]"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveOutcome}
              disabled={updateAttempt.isPending}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Capture Modal */}
      <Modal isOpen={captureModal} onClose={() => setCaptureModal(false)} title="Capture as Proofed">
        <div className="space-y-4">
          <p className="text-sm text-dusty-mauve">
            Save this attempt as a proven recipe in your Proofed collection.
          </p>
          <div>
            <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Name</p>
            <input
              type="text"
              value={captureName}
              onChange={(e) => setCaptureName(e.target.value)}
              placeholder="e.g., My Perfect Vanilla Cake"
              autoFocus
              className="w-full rounded-xl border border-black/10 bg-white h-14 px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Notes</p>
            <textarea
              value={captureNotes}
              onChange={(e) => setCaptureNotes(e.target.value)}
              placeholder="Why does this combination work?"
              rows={3}
              className="w-full rounded-xl border border-black/10 bg-white p-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setCaptureModal(false)}
              className="flex-1 py-3 rounded-xl border border-black/10 font-bold text-[#171112]"
            >
              Cancel
            </button>
            <button
              onClick={handleCapture}
              disabled={!captureName.trim() || captureAttempt.isPending}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-50"
            >
              Capture
            </button>
          </div>
        </div>
      </Modal>

      {/* Photo Lightbox */}
      {lightboxIndex !== null && attempt.photoKeys && (
        <PhotoLightbox
          photoKeys={attempt.photoKeys}
          currentIndex={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Edit Date Modal */}
      <Modal isOpen={editDateModal} onClose={() => setEditDateModal(false)} title="Change Date">
        <div className="space-y-4">
          <div>
            <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Bake Date</p>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white h-14 px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setEditDateModal(false)}
              className="flex-1 py-3 rounded-xl border border-black/10 font-bold text-[#171112]"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDate}
              disabled={updateAttempt.isPending}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Name Modal */}
      <Modal isOpen={editNameModal} onClose={() => setEditNameModal(false)} title="Change Name">
        <div className="space-y-4">
          <div>
            <p className="text-[#171112] text-sm font-medium leading-normal pb-2">Attempt Name</p>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
              className="w-full rounded-xl border border-black/10 bg-white h-14 px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setEditNameModal(false)}
              className="flex-1 py-3 rounded-xl border border-black/10 font-bold text-[#171112]"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveName}
              disabled={updateAttempt.isPending || !editName.trim()}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Items Modal */}
      <Modal isOpen={editItemsModal} onClose={() => setEditItemsModal(false)} title="Edit Items Used">
        <EditItemsForm
          itemUsages={attempt.itemUsages}
          onSave={(itemUsages) => {
            updateAttempt.mutate(
              { attemptId: attemptId!, data: { itemUsages } },
              { onSuccess: () => setEditItemsModal(false) }
            );
          }}
          onCancel={() => setEditItemsModal(false)}
          isLoading={updateAttempt.isPending}
        />
      </Modal>
    </div>
  );
}

function ItemUsageDisplay({ usage }: { usage: ItemUsage }) {
  const { data: item } = useItem(usage.itemId);
  const { data: recipe } = useRecipe(usage.itemId, usage.recipeId);
  const { data: variant } = useVariant(
    usage.itemId,
    usage.recipeId,
    usage.variantId || ''
  );

  const scaleFactor = usage.scaleFactor ?? 1;

  // Build URL with query params for deep linking to recipe
  const recipeUrl = `/items/${usage.itemId}?recipeId=${usage.recipeId}${
    scaleFactor !== 1 ? `&scale=${scaleFactor}` : ''
  }${usage.variantId ? `&variantId=${usage.variantId}` : ''}`;

  return (
    <Link
      to={recipeUrl}
      className="block bg-white rounded-xl border border-black/5 shadow-sm p-4 active:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-10">
          <Icon name="cake" size="sm" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#171112] text-sm">{item?.name || 'Loading...'}</p>
          <p className="text-xs text-dusty-mauve">
            {recipe?.name || 'Loading...'}
            {variant && (
              <span className="text-primary font-medium"> • {variant.name}</span>
            )}
            {scaleFactor !== 1 && (
              <span className="text-primary font-medium"> • {formatScaleFactor(scaleFactor)} scale</span>
            )}
          </p>
          {recipe?.container && (
            <p className="text-xs text-dusty-mauve mt-0.5">
              {formatContainer(
                recipe.container.type,
                recipe.container.size,
                recipe.container.count,
                scaleFactor
              )}
            </p>
          )}
        </div>
        <Icon name="chevron_right" size="sm" className="text-dusty-mauve" />
      </div>
      {usage.notes && (
        <p className="text-xs text-dusty-mauve mt-2 pl-13">{usage.notes}</p>
      )}
    </Link>
  );
}

function PhotoThumbnail({
  photoKey,
  isMain,
  onTap,
  onRemove,
  onSetMain,
}: {
  photoKey: string;
  isMain: boolean;
  onTap: () => void;
  onRemove: () => void;
  onSetMain: () => void;
}) {
  const { data: url, isLoading } = usePhotoUrl(photoKey);

  if (isLoading || !url) {
    return (
      <div className="aspect-square bg-pastel-pink/20 rounded-xl flex items-center justify-center">
        <Icon name="image" className="text-dusty-mauve animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative aspect-square">
      <button onClick={onTap} className="w-full h-full">
        <img
          src={url}
          alt="Bake photo"
          className={`w-full h-full rounded-xl object-cover ${isMain ? 'ring-2 ring-primary ring-offset-2' : ''}`}
        />
      </button>
      {isMain && (
        <div className="absolute bottom-1 left-1 bg-primary text-white rounded-full px-2 py-0.5 text-[10px] font-bold">
          Main
        </div>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onSetMain(); }}
        className={`absolute top-1 left-1 rounded-full p-1 transition-colors ${
          isMain ? 'bg-primary text-white' : 'bg-black/50 hover:bg-black/70 text-white'
        }`}
      >
        <Icon name="star" size="sm" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
      >
        <Icon name="close" size="sm" />
      </button>
    </div>
  );
}

function PhotoLightbox({
  photoKeys,
  currentIndex,
  onIndexChange,
  onClose,
}: {
  photoKeys: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const { data: url } = usePhotoUrl(photoKeys[currentIndex]);

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < photoKeys.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    } else if (e.key === 'ArrowRight' && currentIndex < photoKeys.length - 1) {
      onIndexChange(currentIndex + 1);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white p-2 z-10"
      >
        <Icon name="close" size="lg" />
      </button>

      {/* Counter */}
      {photoKeys.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium">
          {currentIndex + 1} / {photoKeys.length}
        </div>
      )}

      {/* Previous button */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-white p-3 bg-black/30 rounded-full hover:bg-black/50 transition-colors z-10"
        >
          <Icon name="chevron_left" size="lg" />
        </button>
      )}

      {/* Image */}
      {url && (
        <img
          src={url}
          alt="Full size photo"
          className="max-w-full max-h-full object-contain p-4"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Next button */}
      {currentIndex < photoKeys.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white p-3 bg-black/30 rounded-full hover:bg-black/50 transition-colors z-10"
        >
          <Icon name="chevron_right" size="lg" />
        </button>
      )}
    </div>
  );
}

function EditItemsForm({
  itemUsages,
  onSave,
  onCancel,
  isLoading,
}: {
  itemUsages: ItemUsage[];
  onSave: (itemUsages: ItemUsage[]) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const { data: items } = useItems();
  const [usages, setUsages] = useState<(ItemUsage & { _key: string })[]>(
    itemUsages.map((u, i) => ({ ...u, _key: `existing-${i}` }))
  );

  const addUsage = () => {
    setUsages([...usages, { _key: Date.now().toString(), itemId: '', recipeId: '' }]);
  };

  const updateUsage = (key: string, updates: Partial<ItemUsage>) => {
    setUsages(usages.map((u) => (u._key === key ? { ...u, ...updates } : u)));
  };

  const removeUsage = (key: string) => {
    setUsages(usages.filter((u) => u._key !== key));
  };

  const handleSave = () => {
    const validUsages = usages
      .filter((u) => u.itemId && u.recipeId)
      .map(({ _key, ...usage }) => usage);
    onSave(validUsages);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-[50vh] overflow-y-auto">
        {usages.map((usage) => (
          <EditItemUsageRow
            key={usage._key}
            usage={usage}
            items={items || []}
            onUpdate={(updates) => updateUsage(usage._key, updates)}
            onRemove={() => removeUsage(usage._key)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={addUsage}
        className="w-full py-3 rounded-xl border-2 border-dashed border-pastel-pink text-primary font-bold"
      >
        + Add Item
      </button>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-black/10 font-bold text-[#171112]"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex-1 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function EditItemUsageRow({
  usage,
  items,
  onUpdate,
  onRemove,
}: {
  usage: ItemUsage & { _key: string };
  items: { itemId: string; name: string }[];
  onUpdate: (updates: Partial<ItemUsage>) => void;
  onRemove: () => void;
}) {
  const { data: recipes } = useRecipes(usage.itemId);
  const { data: variants } = useVariants(usage.itemId, usage.recipeId);

  return (
    <div className="bg-bg-light rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={usage.itemId}
          onChange={(e) => onUpdate({ itemId: e.target.value, recipeId: '', variantId: undefined })}
          className="flex-1 rounded-lg border border-black/10 bg-white h-10 px-3 text-sm"
        >
          <option value="">Select item...</option>
          {items.map((i) => (
            <option key={i.itemId} value={i.itemId}>{i.name}</option>
          ))}
        </select>
        <button onClick={onRemove} className="p-2 text-dusty-mauve">
          <Icon name="close" size="sm" />
        </button>
      </div>
      {usage.itemId && (
        <select
          value={usage.recipeId}
          onChange={(e) => onUpdate({ recipeId: e.target.value, variantId: undefined })}
          className="w-full rounded-lg border border-black/10 bg-white h-10 px-3 text-sm"
        >
          <option value="">Select recipe...</option>
          {(recipes || []).map((r) => (
            <option key={r.recipeId} value={r.recipeId}>{r.name}</option>
          ))}
        </select>
      )}
      {usage.recipeId && variants && variants.length > 0 && (
        <select
          value={usage.variantId || ''}
          onChange={(e) => onUpdate({ variantId: e.target.value || undefined })}
          className="w-full rounded-lg border border-black/10 bg-white h-10 px-3 text-sm"
        >
          <option value="">Base recipe</option>
          {variants.map((v) => (
            <option key={v.variantId} value={v.variantId}>{v.name}</option>
          ))}
        </select>
      )}
      {usage.recipeId && (
        <div className="flex gap-1 flex-wrap">
          {getScaleOptions(recipes?.find(r => r.recipeId === usage.recipeId)?.customScales).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onUpdate({ scaleFactor: option.value === 1 ? undefined : option.value })}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors ${
                (usage.scaleFactor ?? 1) === option.value
                  ? 'bg-primary text-white'
                  : 'bg-white text-dusty-mauve'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

