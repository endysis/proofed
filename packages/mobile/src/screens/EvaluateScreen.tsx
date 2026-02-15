import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Icon, Modal, Loading, FavoriteButton, Skeleton, SkeletonThumbnail } from '../components/common';
import { PhotoUpload, ImageAsset, LuxuryPhotoGallery } from '../components/photos';
import { AiAdviceSection } from '../components/ai';
import { useAttempt, useUpdateAttempt, useDeleteAttempt, useCreateAttempt } from '../hooks/useAttempts';
import { useAiAdvice } from '../hooks/useAiAdvice';
import { useItem } from '../hooks/useItems';
import { useRecipe } from '../hooks/useRecipes';
import { useVariant, useCreateVariant } from '../hooks/useVariants';
import VariantForm from '../components/variants/VariantForm';
import { usePhotoUpload, usePhotoUrl } from '../hooks/usePhotos';
import { useItemUsageDetails } from '../hooks/useItemUsageDetails';
import { formatScaleFactor } from '../utils/scaleRecipe';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { ItemUsage, AiAdviceResponse, AiAdviceRequest, AiAdviceTip } from '@proofed/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type EvaluateScreenRouteProp = RouteProp<RootStackParamList, 'EvaluateScreen'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const typeIcons: Record<string, string> = {
  batter: 'cake',
  frosting: 'water_drop',
  filling: 'icecream',
  dough: 'cookie',
  glaze: 'format_paint',
  other: 'category',
};

export default function EvaluateScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EvaluateScreenRouteProp>();
  const { attemptId, openGallery } = route.params;

  const { data: attempt, isLoading } = useAttempt(attemptId);
  const updateAttempt = useUpdateAttempt();
  const deleteAttempt = useDeleteAttempt();
  const createAttempt = useCreateAttempt();
  const photoUpload = usePhotoUpload();
  const aiAdviceMutation = useAiAdvice();
  const createVariantMutation = useCreateVariant();
  const { data: mainPhotoUrl } = usePhotoUrl(attempt?.mainPhotoKey);
  const { details: itemUsageDetails } = useItemUsageDetails(attempt?.itemUsages || []);

  const [showActions, setShowActions] = useState(false);
  const [outcomeModal, setOutcomeModal] = useState(false);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [photoGallery, setPhotoGallery] = useState<{ isOpen: boolean; initialIndex: number }>({
    isOpen: false,
    initialIndex: 0,
  });
  const [hasAutoOpenedGallery, setHasAutoOpenedGallery] = useState(false);
  const [expandedItems, setExpandedItems] = useState(true);

  // Auto-open gallery if openGallery param is true and there are photos
  React.useEffect(() => {
    if (openGallery && attempt && !hasAutoOpenedGallery) {
      const hasPhotos = attempt.mainPhotoKey || (attempt.photoKeys && attempt.photoKeys.length > 0);
      if (hasPhotos) {
        setPhotoGallery({ isOpen: true, initialIndex: 0 });
        setHasAutoOpenedGallery(true);
      }
    }
  }, [openGallery, attempt, hasAutoOpenedGallery]);
  const [aiAdvice, setAiAdvice] = useState<AiAdviceResponse | null>(null);
  const [variantCreation, setVariantCreation] = useState<{
    isOpen: boolean;
    tip: AiAdviceTip | null;
    step: 'select-item' | 'create-variant';
    selectedUsageIndex: number | null;
  }>({ isOpen: false, tip: null, step: 'select-item', selectedUsageIndex: null });

  const handleDelete = () => {
    Alert.alert('Delete Attempt', 'Are you sure you want to delete this attempt?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteAttempt.mutate(attemptId, { onSuccess: () => navigation.goBack() });
        },
      },
    ]);
  };

  const handleSaveOutcome = () => {
    updateAttempt.mutate(
      { attemptId, data: { outcomeNotes } },
      { onSuccess: () => setOutcomeModal(false) }
    );
  };

  const handleRebake = () => {
    if (!attempt) return;

    // Parse current name to determine next number
    const match = attempt.name.match(/^(.+?)\s*#(\d+)$/);
    let baseName: string;
    let nextNumber: number;

    if (match) {
      baseName = match[1];
      nextNumber = parseInt(match[2], 10) + 1;
    } else {
      baseName = attempt.name;
      nextNumber = 2;
    }

    const newName = `${baseName} #${nextNumber}`;

    createAttempt.mutate(
      {
        name: newName,
        date: new Date().toISOString(),
        itemUsages: attempt.itemUsages,
        status: 'planning',
      },
      {
        onSuccess: (newAttempt) => {
          navigation.replace('PlanScreen', { attemptId: newAttempt.attemptId });
        },
      }
    );
  };

  const handlePhotoUpload = async (image: ImageAsset) => {
    try {
      const key = await photoUpload.mutateAsync({ attemptId, image });
      const photoKeys = [...(attempt?.photoKeys || []), key];
      updateAttempt.mutate({ attemptId, data: { photoKeys } });
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  const handleSetMainPhoto = (photoKey: string) => {
    updateAttempt.mutate(
      { attemptId, data: { mainPhotoKey: photoKey } },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Main photo updated');
        },
      }
    );
  };

  const handleDeletePhoto = (photoKey: string) => {
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const currentPhotoKeys = attempt?.photoKeys || [];
          const newPhotoKeys = currentPhotoKeys.filter((k) => k !== photoKey);

          const updates: { photoKeys: string[]; mainPhotoKey?: string } = { photoKeys: newPhotoKeys };
          if (attempt?.mainPhotoKey === photoKey) {
            updates.mainPhotoKey = newPhotoKeys[0] || '';
          }

          updateAttempt.mutate({ attemptId, data: updates });

          if (newPhotoKeys.length === 0) {
            setPhotoGallery({ isOpen: false, initialIndex: 0 });
          }
        },
      },
    ]);
  };

  const handleToggleStar = () => {
    updateAttempt.mutate({
      attemptId,
      data: { starred: !attempt?.starred },
    });
  };

  const handleResumeSession = () => {
    updateAttempt.mutate(
      { attemptId, data: { status: 'baking' } },
      {
        onSuccess: () => {
          navigation.replace('BakeScreen', { attemptId });
        },
      }
    );
  };

  const handleRequestAdvice = () => {
    if (!attempt || !attempt.outcomeNotes?.trim()) return;

    // Build the request with full context from item usage details
    // Use baseIngredients (unscaled) so AI suggestions can be saved as variants correctly
    const request: AiAdviceRequest = {
      outcomeNotes: attempt.outcomeNotes,
      photoUrl: mainPhotoUrl || undefined,  // Include main photo URL if available
      context: {
        attemptName: attempt.name,
        itemUsages: itemUsageDetails.map((detail) => ({
          itemName: detail.itemName,
          recipeName: detail.recipeName,
          variantName: detail.variantName,
          scaleFactor: detail.scaleFactor,
          ingredients: detail.baseIngredients,
          bakeTime: detail.bakeTime,
          bakeTemp: detail.bakeTemp,
          bakeTempUnit: detail.bakeTempUnit,
        })),
      },
    };

    aiAdviceMutation.mutate(
      { attemptId, request },
      {
        onSuccess: (response) => {
          setAiAdvice(response);
        },
      }
    );
  };

  const handleCreateVariantFromTip = (tip: AiAdviceTip) => {
    if (!attempt) return;

    // If tip has itemUsageIndex, use it directly (skip item picker)
    if (typeof tip.itemUsageIndex === 'number' && tip.itemUsageIndex < attempt.itemUsages.length) {
      setVariantCreation({
        isOpen: true,
        tip,
        step: 'create-variant',
        selectedUsageIndex: tip.itemUsageIndex,
      });
    } else if (attempt.itemUsages.length === 1) {
      // If only one item usage, skip item picker and go directly to form
      setVariantCreation({
        isOpen: true,
        tip,
        step: 'create-variant',
        selectedUsageIndex: 0,
      });
    } else {
      // Multiple items and no itemUsageIndex - show item picker first (fallback)
      setVariantCreation({
        isOpen: true,
        tip,
        step: 'select-item',
        selectedUsageIndex: null,
      });
    }
  };

  const handleSelectItemForVariant = (index: number) => {
    setVariantCreation((prev) => ({
      ...prev,
      step: 'create-variant',
      selectedUsageIndex: index,
    }));
  };

  const handleCloseVariantCreation = () => {
    setVariantCreation({
      isOpen: false,
      tip: null,
      step: 'select-item',
      selectedUsageIndex: null,
    });
  };

  const handleSubmitVariant = (data: { name: string; ingredientOverrides: any[]; notes?: string; bakeTime?: number; bakeTemp?: number; bakeTempUnit?: 'F' | 'C' }) => {
    if (!attempt || variantCreation.selectedUsageIndex === null || !variantCreation.tip) return;

    const usage = attempt.itemUsages[variantCreation.selectedUsageIndex];

    createVariantMutation.mutate(
      {
        itemId: usage.itemId,
        recipeId: usage.recipeId,
        data: {
          name: data.name || variantCreation.tip.title,
          ingredientOverrides: data.ingredientOverrides,
          notes: data.notes || variantCreation.tip.suggestion,
          bakeTime: data.bakeTime,
          bakeTemp: data.bakeTemp,
          bakeTempUnit: data.bakeTempUnit,
        },
      },
      {
        onSuccess: () => {
          handleCloseVariantCreation();
          Alert.alert('Variant Created', 'Your new variant has been saved.');
        },
      }
    );
  };

  if (!attempt && !isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Attempt not found</Text>
      </View>
    );
  }

  // Combine mainPhotoKey and photoKeys, removing duplicates
  const allPhotoKeys = attempt ? [
    ...(attempt.mainPhotoKey ? [attempt.mainPhotoKey] : []),
    ...(attempt.photoKeys || []),
  ].filter((key, index, arr) => arr.indexOf(key) === index) : [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow_back_ios" color={colors.text} size="md" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bake Details</Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowActions(true)}
          disabled={isLoading}
        >
          <Icon name="more_vert" color={isLoading ? colors.dustyMauve : colors.text} size="md" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {isLoading ? (
          <EvaluateScreenSkeleton />
        ) : attempt ? (
          <>
            {/* Status Badge */}
            <View style={styles.statusBadgeRow}>
              <View style={[styles.statusBadge, { backgroundColor: '#D4EDDA' }]}>
                <Text style={[styles.statusBadgeText, { color: '#155724' }]}>
                  COMPLETE
                </Text>
              </View>
              <FavoriteButton
                isStarred={attempt.starred ?? false}
                onToggle={handleToggleStar}
                disabled={updateAttempt.isPending}
              />
            </View>

            {/* Title & Date */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>{attempt.name}</Text>
              <View style={styles.dateRow}>
                <Icon name="calendar_today" size="sm" color={colors.dustyMauve} />
                <Text style={styles.date}>
                  {new Date(attempt.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            {/* Items Used - Collapsible */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setExpandedItems(!expandedItems)}
              >
                <Text style={styles.sectionTitle}>
                  {attempt.itemUsages.length} Item{attempt.itemUsages.length !== 1 ? 's' : ''} Used
                </Text>
                <Icon
                  name={expandedItems ? 'expand_less' : 'expand_more'}
                  size="md"
                  color={colors.dustyMauve}
                />
              </TouchableOpacity>

              {expandedItems && (
            <>
              {attempt.itemUsages.length > 0 ? (
                attempt.itemUsages.map((usage, index) => (
                  <ItemUsageDisplay key={index} usage={usage} />
                ))
              ) : (
                <View style={styles.card}>
                  <Text style={styles.emptyText}>No items recorded</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Photo Gallery */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <PhotoUpload onUpload={handlePhotoUpload} isLoading={photoUpload.isPending} />
          </View>
          <FeaturedPhotoGrid
            photoKeys={allPhotoKeys}
            mainPhotoKey={attempt.mainPhotoKey}
            onPhotoPress={(index) => setPhotoGallery({ isOpen: true, initialIndex: index })}
            onAddPress={() => {}}
          />
          {photoGallery.isOpen && (
            <LuxuryPhotoGallery
              photoKeys={allPhotoKeys}
              mainPhotoKey={attempt.mainPhotoKey}
              initialIndex={photoGallery.initialIndex}
              title={attempt.name}
              date={attempt.date}
              onClose={() => setPhotoGallery({ isOpen: false, initialIndex: 0 })}
              onBack={openGallery ? () => navigation.goBack() : undefined}
              onSetMain={handleSetMainPhoto}
              onDelete={handleDeletePhoto}
              onRebake={handleRebake}
            />
          )}
        </View>

        {/* Outcome */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Outcome</Text>
            <TouchableOpacity
              onPress={() => {
                setOutcomeNotes(attempt.outcomeNotes || '');
                setOutcomeModal(true);
              }}
            >
              <Text style={styles.addLink}>
                {attempt.outcomeNotes ? 'Edit' : '+ Add'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {attempt.outcomeNotes ? (
              <Text style={styles.cardText}>{attempt.outcomeNotes}</Text>
            ) : (
              <Text style={styles.emptyText}>No outcome logged yet</Text>
            )}
          </View>

          {/* AI Advice Section */}
          <AiAdviceSection
            advice={aiAdvice}
            isLoading={aiAdviceMutation.isPending}
            error={aiAdviceMutation.error}
            onRequestAdvice={handleRequestAdvice}
            onCreateVariantFromTip={handleCreateVariantFromTip}
            canRequest={!!attempt.outcomeNotes?.trim()}
            hasPhoto={!!attempt.mainPhotoKey}
            itemUsageDetails={itemUsageDetails}
          />
        </View>

            <View style={{ height: 160 }} />
          </>
        ) : null}
      </ScrollView>

      {/* Bottom Action */}
      {attempt && (
        <View style={[styles.bottomAction, { paddingBottom: insets.bottom + spacing[4] }]}>
          <TouchableOpacity
            style={styles.saveExitButton}
            onPress={() => navigation.navigate('Tabs', { screen: 'Bakes' })}
          >
            <Icon name="save" color={colors.primary} size="md" />
            <Text style={styles.saveExitButtonText}>Save & Exit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rebakeButton, createAttempt.isPending && styles.buttonDisabled]}
            onPress={handleRebake}
            disabled={createAttempt.isPending}
          >
            <Icon name="replay" color={colors.white} size="md" />
            <Text style={styles.rebakeButtonText}>Rebake</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action Sheet */}
      <Modal isOpen={showActions} onClose={() => setShowActions(false)} title="Actions">
        <TouchableOpacity
          style={styles.actionOption}
          onPress={() => {
            setShowActions(false);
            handleResumeSession();
          }}
        >
          <Icon name="play_arrow" color={colors.text} size="md" />
          <Text style={styles.actionOptionText}>Resume Session</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionOption}
          onPress={() => {
            setShowActions(false);
            handleDelete();
          }}
        >
          <Icon name="delete" color={colors.primary} size="md" />
          <Text style={[styles.actionOptionText, { color: colors.primary }]}>
            Delete Attempt
          </Text>
        </TouchableOpacity>
      </Modal>

      {/* Outcome Modal */}
      <Modal isOpen={outcomeModal} onClose={() => setOutcomeModal(false)} title="Log Outcome">
        <Text style={styles.modalLabel}>Outcome Notes</Text>
        <TextInput
          style={styles.textArea}
          value={outcomeNotes}
          onChangeText={setOutcomeNotes}
          placeholder="What worked? What didn't?"
          placeholderTextColor={colors.dustyMauve}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setOutcomeModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSaveOutcome}
            disabled={updateAttempt.isPending}
          >
            <Text style={styles.submitButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Modal>


      {/* Variant Creation Modal */}
      <Modal
        isOpen={variantCreation.isOpen}
        onClose={handleCloseVariantCreation}
        title={variantCreation.step === 'select-item' ? 'Select Item' : 'Create Variant'}
      >
        {variantCreation.step === 'select-item' && attempt && (
          <>
            <Text style={styles.itemPickerHint}>
              Which item should this variant apply to?
            </Text>
            {attempt.itemUsages.map((usage, index) => {
              const detail = itemUsageDetails[index];
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.itemPickerOption}
                  onPress={() => handleSelectItemForVariant(index)}
                >
                  <View style={styles.itemPickerIcon}>
                    <Icon name={typeIcons[detail?.itemType || 'other'] || 'category'} size="sm" color={colors.primary} />
                  </View>
                  <View style={styles.itemPickerInfo}>
                    <Text style={styles.itemPickerName}>{detail?.itemName || 'Loading...'}</Text>
                    <Text style={styles.itemPickerRecipe}>
                      {detail?.recipeName || 'Loading...'}
                      {detail?.variantName && ` (${detail.variantName})`}
                    </Text>
                  </View>
                  <Icon name="chevron_right" size="sm" color={colors.dustyMauve} />
                </TouchableOpacity>
              );
            })}
          </>
        )}
        {variantCreation.step === 'create-variant' &&
          variantCreation.selectedUsageIndex !== null &&
          variantCreation.tip && (
            <VariantForm
              recipeIngredients={itemUsageDetails[variantCreation.selectedUsageIndex]?.ingredients || []}
              onSubmit={handleSubmitVariant}
              onCancel={handleCloseVariantCreation}
              isLoading={createVariantMutation.isPending}
              variant={{
                variantId: '',
                userId: '',
                recipeId: '',
                itemId: '',
                name: variantCreation.tip.title,
                ingredientOverrides: variantCreation.tip.ingredientOverrides || [],
                notes: variantCreation.tip.suggestion,
                bakeTime: variantCreation.tip.bakeTime,
                bakeTemp: variantCreation.tip.bakeTemp,
                bakeTempUnit: variantCreation.tip.bakeTempUnit,
                createdAt: '',
                updatedAt: '',
              }}
            />
          )}
      </Modal>
    </View>
  );
}

function EvaluateScreenSkeleton() {
  return (
    <>
      {/* Status Badge Skeleton */}
      <View style={styles.statusBadgeRow}>
        <Skeleton width={90} height={32} borderRadius={borderRadius.lg} />
        <Skeleton width={32} height={32} borderRadius={borderRadius.full} />
      </View>

      {/* Title & Date Skeleton */}
      <View style={styles.titleSection}>
        <Skeleton width="80%" height={28} />
        <View style={[styles.dateRow, { marginTop: spacing[2] }]}>
          <Skeleton width={16} height={16} borderRadius={4} />
          <Skeleton width={180} height={16} />
        </View>
      </View>

      {/* Items Used Section Skeleton */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Skeleton width={140} height={14} />
          <Skeleton width={24} height={24} />
        </View>
        {/* Usage cards skeleton */}
        <View style={styles.usageCard}>
          <Skeleton width={40} height={40} borderRadius={borderRadius.lg} />
          <View style={[styles.usageInfo, { gap: spacing[1] }]}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={12} />
          </View>
          <Skeleton width={16} height={16} />
        </View>
        <View style={styles.usageCard}>
          <Skeleton width={40} height={40} borderRadius={borderRadius.lg} />
          <View style={[styles.usageInfo, { gap: spacing[1] }]}>
            <Skeleton width="70%" height={14} />
            <Skeleton width="50%" height={12} />
          </View>
          <Skeleton width={16} height={16} />
        </View>
      </View>

      {/* Photos Section Skeleton */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Skeleton width={60} height={14} />
          <Skeleton width={32} height={32} borderRadius={borderRadius.full} />
        </View>
        <View style={styles.featuredGrid}>
          <Skeleton width="100%" height={240} borderRadius={borderRadius.xl} style={{ flex: 1.6 }} />
          <View style={styles.smallPhotoColumn}>
            <Skeleton width="100%" height={0} borderRadius={borderRadius.xl} style={{ flex: 1 }} />
            <Skeleton width="100%" height={0} borderRadius={borderRadius.xl} style={{ flex: 1 }} />
          </View>
        </View>
      </View>

      {/* Outcome Section Skeleton */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Skeleton width={70} height={14} />
          <Skeleton width={40} height={14} />
        </View>
        <View style={styles.card}>
          <Skeleton width="90%" height={14} />
          <Skeleton width="70%" height={14} style={{ marginTop: spacing[2] }} />
        </View>
      </View>

      <View style={{ height: 160 }} />
    </>
  );
}

function ItemUsageDisplay({ usage }: { usage: ItemUsage }) {
  const navigation = useNavigation<NavigationProp>();
  const { data: item } = useItem(usage.itemId);
  const { data: recipe } = useRecipe(usage.itemId, usage.recipeId);
  const { data: variant } = useVariant(usage.itemId, usage.recipeId, usage.variantId || '');

  const scaleFactor = usage.scaleFactor ?? 1;

  return (
    <TouchableOpacity
      style={styles.usageCard}
      onPress={() => navigation.navigate('ItemDetail', { itemId: usage.itemId })}
    >
      <View style={styles.usageIcon}>
        <Icon name={typeIcons[item?.type || 'other'] || 'category'} size="sm" color={colors.primary} />
      </View>
      <View style={styles.usageInfo}>
        <Text style={styles.usageName}>{item?.name || 'Loading...'}</Text>
        <Text style={styles.usageDetails}>
          {recipe?.name || 'Loading...'}
          {variant && <Text style={styles.usageHighlight}> • {variant.name}</Text>}
          {scaleFactor !== 1 && (
            <Text style={styles.usageHighlight}> • {formatScaleFactor(scaleFactor)} scale</Text>
          )}
        </Text>
      </View>
      <Icon name="chevron_right" size="sm" color={colors.dustyMauve} />
    </TouchableOpacity>
  );
}

function FeaturedPhotoGrid({
  photoKeys,
  mainPhotoKey,
  onPhotoPress,
  onAddPress,
}: {
  photoKeys: string[];
  mainPhotoKey?: string;
  onPhotoPress: (index: number) => void;
  onAddPress: () => void;
}) {
  const displayPhotos = photoKeys.slice(0, 3);
  const remainingCount = photoKeys.length - 3;

  if (photoKeys.length === 0) {
    return (
      <TouchableOpacity style={styles.emptyPhotos} onPress={onAddPress} activeOpacity={0.7}>
        <Icon name="add_a_photo" size="xl" color={colors.dustyMauve} />
        <Text style={styles.emptyText}>No photos yet</Text>
      </TouchableOpacity>
    );
  }

  if (photoKeys.length === 1) {
    return (
      <View style={styles.featuredGrid}>
        <FeaturedPhoto
          photoKey={displayPhotos[0]}
          isMain={displayPhotos[0] === mainPhotoKey}
          onPress={() => onPhotoPress(0)}
          style={styles.singlePhoto}
        />
      </View>
    );
  }

  if (photoKeys.length === 2) {
    return (
      <View style={styles.featuredGrid}>
        <FeaturedPhoto
          photoKey={displayPhotos[0]}
          isMain={displayPhotos[0] === mainPhotoKey}
          onPress={() => onPhotoPress(0)}
          style={styles.largePhoto}
        />
        <View style={styles.smallPhotoColumn}>
          <FeaturedPhoto
            photoKey={displayPhotos[1]}
            isMain={displayPhotos[1] === mainPhotoKey}
            onPress={() => onPhotoPress(1)}
            style={styles.singleSmallPhoto}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.featuredGrid}>
      <FeaturedPhoto
        photoKey={displayPhotos[0]}
        isMain={displayPhotos[0] === mainPhotoKey}
        onPress={() => onPhotoPress(0)}
        style={styles.largePhoto}
      />
      <View style={styles.smallPhotoColumn}>
        <FeaturedPhoto
          photoKey={displayPhotos[1]}
          isMain={displayPhotos[1] === mainPhotoKey}
          onPress={() => onPhotoPress(1)}
          style={styles.smallPhoto}
        />
        <View style={styles.smallPhotoWrapper}>
          <FeaturedPhoto
            photoKey={displayPhotos[2]}
            isMain={displayPhotos[2] === mainPhotoKey}
            onPress={() => onPhotoPress(2)}
            style={styles.smallPhoto}
          />
          {remainingCount > 0 && (
            <TouchableOpacity
              style={styles.moreOverlay}
              onPress={() => onPhotoPress(2)}
              activeOpacity={0.8}
            >
              <Text style={styles.moreText}>+{remainingCount}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

function FeaturedPhoto({
  photoKey,
  isMain,
  onPress,
  style,
}: {
  photoKey: string;
  isMain?: boolean;
  onPress?: () => void;
  style?: any;
}) {
  const { data: url, isLoading, isError } = usePhotoUrl(photoKey);
  const [imageError, setImageError] = React.useState(false);

  if (isLoading) {
    return (
      <View style={[styles.featuredPhotoPlaceholder, style]}>
        <SkeletonThumbnail size="featured" style={styles.featuredSkeleton} />
      </View>
    );
  }

  if (isError || !url || imageError) {
    return (
      <View style={[styles.featuredPhotoPlaceholder, style]}>
        <Icon name="broken_image" color={colors.dustyMauve} size="md" />
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={style}>
      <View style={{ flex: 1 }}>
        <Image
          source={{ uri: url }}
          style={styles.featuredImage}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
        {isMain && (
          <View style={styles.mainPhotoBadge}>
            <Icon name="star" size="sm" color={colors.white} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function PhotoThumbnail({
  photoKey,
  isMain,
  onPress,
}: {
  photoKey: string;
  isMain?: boolean;
  onPress?: () => void;
}) {
  const { data: url, isLoading, isError } = usePhotoUrl(photoKey);
  const [imageError, setImageError] = React.useState(false);

  if (isLoading) {
    return (
      <View style={styles.photoPlaceholder}>
        <Icon name="image" color={colors.dustyMauve} size="md" />
      </View>
    );
  }

  if (isError || !url || imageError) {
    return (
      <View style={styles.photoPlaceholder}>
        <Icon name="broken_image" color={colors.dustyMauve} size="md" />
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View>
        <Image
          source={{ uri: url }}
          style={styles.photo}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
        {isMain && (
          <View style={styles.mainPhotoBadge}>
            <Icon name="star" size="sm" color={colors.white} />
          </View>
        )}
      </View>
    </TouchableOpacity>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
  },
  statusBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    letterSpacing: 0.5,
  },
  titleSection: {
    paddingTop: spacing[4],
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    color: colors.text,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  date: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  section: {
    marginTop: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addLink: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    padding: spacing[4],
  },
  cardText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    textAlign: 'center',
  },
  usageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    padding: spacing[4],
    marginBottom: spacing[2],
  },
  usageIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  usageInfo: {
    flex: 1,
  },
  usageName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  usageDetails: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
  },
  usageHighlight: {
    color: colors.primary,
    fontFamily: fontFamily.medium,
  },
  featuredGrid: {
    flexDirection: 'row',
    gap: spacing[2],
    height: 240,
  },
  largePhoto: {
    flex: 1.6,
    height: '100%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  singlePhoto: {
    flex: 1,
    height: '100%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  smallPhotoColumn: {
    flex: 1,
    gap: spacing[2],
  },
  smallPhoto: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  singleSmallPhoto: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  smallPhotoWrapper: {
    flex: 1,
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.xl,
  },
  featuredPhotoPlaceholder: {
    backgroundColor: 'rgba(244, 172, 183, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.xl,
  },
  featuredSkeleton: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.xl,
  },
  moreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.white,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  photo: {
    width: (Dimensions.get('window').width - spacing[4] * 2 - spacing[2] * 2) / 3,
    height: (Dimensions.get('window').width - spacing[4] * 2 - spacing[2] * 2) / 3,
    borderRadius: borderRadius.xl,
  },
  photoPlaceholder: {
    width: (Dimensions.get('window').width - spacing[4] * 2 - spacing[2] * 2) / 3,
    height: (Dimensions.get('window').width - spacing[4] * 2 - spacing[2] * 2) / 3,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(244, 172, 183, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPhotos: {
    padding: spacing[8],
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.pastelPink,
    alignItems: 'center',
    gap: spacing[2],
  },
  mainPhotoBadge: {
    position: 'absolute',
    top: spacing[1],
    right: spacing[1],
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    padding: spacing[1],
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[4],
    backgroundColor: colors.bgLight,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    flexDirection: 'row',
    gap: spacing[3],
  },
  saveExitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
  },
  saveExitButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.primary,
  },
  rebakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
  },
  rebakeButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.white,
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
  modalLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing[2],
    marginTop: spacing[4],
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.xl,
    height: 56,
    paddingHorizontal: spacing[4],
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  textArea: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
    minHeight: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
  },
  submitButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.white,
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.error,
    padding: spacing[4],
  },
  itemPickerHint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    marginBottom: spacing[4],
  },
  itemPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: spacing[2],
  },
  itemPickerIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  itemPickerInfo: {
    flex: 1,
  },
  itemPickerName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  itemPickerRecipe: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    marginTop: 2,
  },
});
