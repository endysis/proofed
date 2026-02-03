import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAttempt, useUpdateAttempt, useDeleteAttempt, useCaptureAttempt } from '../hooks/useAttempts';
import { useItem } from '../hooks/useItems';
import { useRecipe } from '../hooks/useRecipes';
import { useVariant } from '../hooks/useVariants';
import { usePhotoUpload } from '../hooks/usePhotos';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import Icon from '../components/common/Icon';
import PhotoUpload from '../components/photos/PhotoUpload';
import { formatScaleFactor } from '../utils/scaleRecipe';
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

  if (isLoading) return <Loading />;
  if (!attempt) return <div className="text-red-500 p-4">Attempt not found</div>;

  return (
    <div className="pb-32">
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
        <h1 className="text-[28px] font-bold text-[#171112] leading-tight">{attempt.name}</h1>
        <p className="text-dusty-mauve text-sm mt-1 flex items-center gap-2">
          <Icon name="calendar_today" size="sm" />
          {new Date(attempt.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Bake Details */}
      <div className="mt-6 px-4">
        <h3 className="section-title mb-3">Bake Details</h3>
        <div className="bg-white rounded-xl border border-black/5 shadow-sm p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-dusty-mauve uppercase tracking-wider mb-1">Oven Temp</p>
              <p className="font-bold text-[#171112]">
                {attempt.ovenTemp ? `${attempt.ovenTemp}°${attempt.ovenTempUnit || 'F'}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-dusty-mauve uppercase tracking-wider mb-1">Bake Time</p>
              <p className="font-bold text-[#171112]">
                {attempt.bakeTime ? `${attempt.bakeTime} min` : '—'}
              </p>
            </div>
          </div>
          {attempt.notes && (
            <div className="mt-4 pt-4 border-t border-bg-light">
              <p className="text-xs text-dusty-mauve uppercase tracking-wider mb-2">Notes</p>
              <p className="text-sm text-[#171112]/80 whitespace-pre-wrap">{attempt.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items Used */}
      <div className="mt-6 px-4">
        <h3 className="section-title mb-3">Items Used</h3>
        <div className="space-y-2">
          {attempt.itemUsages.map((usage, index) => (
            <ItemUsageDisplay key={index} usage={usage} />
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
            {attempt.photoKeys.map((_key, index) => (
              <div key={index} className="aspect-square bg-pastel-pink/20 rounded-xl flex items-center justify-center">
                <Icon name="image" className="text-dusty-mauve" />
              </div>
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
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg-light border-t border-black/5 pb-safe">
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

  return (
    <div className="bg-white rounded-xl border border-black/5 shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-10">
          <Icon name="cake" size="sm" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#171112] text-sm">{item?.name || 'Loading...'}</p>
          <p className="text-xs text-dusty-mauve">
            {recipe?.name || 'Loading...'}
            {variant && <span className="text-primary font-medium"> • {variant.name}</span>}
            {usage.scaleFactor && usage.scaleFactor !== 1 && (
              <span className="text-primary font-medium"> • {formatScaleFactor(usage.scaleFactor)} scale</span>
            )}
          </p>
        </div>
      </div>
      {usage.notes && (
        <p className="text-xs text-dusty-mauve mt-2 pl-13">{usage.notes}</p>
      )}
    </div>
  );
}
