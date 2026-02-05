import React, { useState, useRef } from 'react';
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
  FlatList,
  Modal as RNModal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Icon, Modal, Loading } from '../components/common';
import { PhotoUpload, ImageAsset } from '../components/photos';
import { useAttempt, useUpdateAttempt, useDeleteAttempt, useCaptureAttempt } from '../hooks/useAttempts';
import { useItem } from '../hooks/useItems';
import { useRecipe } from '../hooks/useRecipes';
import { useVariant } from '../hooks/useVariants';
import { usePhotoUpload, usePhotoUrl } from '../hooks/usePhotos';
import { formatScaleFactor } from '../utils/scaleRecipe';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { ItemUsage } from '@proofed/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type EvaluateScreenRouteProp = RouteProp<RootStackParamList, 'EvaluateScreen'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function EvaluateScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EvaluateScreenRouteProp>();
  const { attemptId } = route.params;

  const { data: attempt, isLoading } = useAttempt(attemptId);
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
  const [photoGallery, setPhotoGallery] = useState<{ isOpen: boolean; initialIndex: number }>({
    isOpen: false,
    initialIndex: 0,
  });
  const [expandedItems, setExpandedItems] = useState(true);

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

  const handleCapture = () => {
    captureAttempt.mutate(
      { attemptId, data: { name: captureName, notes: captureNotes || undefined } },
      {
        onSuccess: (proofedItem) => {
          setCaptureModal(false);
          navigation.navigate('ProofedItemDetail', {
            proofedItemId: proofedItem.proofedItemId,
          });
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

  if (isLoading) return <Loading />;
  if (!attempt) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Attempt not found</Text>
      </View>
    );
  }

  // Combine mainPhotoKey and photoKeys, removing duplicates
  const allPhotoKeys = [
    ...(attempt.mainPhotoKey ? [attempt.mainPhotoKey] : []),
    ...(attempt.photoKeys || []),
  ].filter((key, index, arr) => arr.indexOf(key) === index);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow_back_ios" color={colors.text} size="md" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Result</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => setShowActions(true)}>
          <Icon name="more_vert" color={colors.text} size="md" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Status Badge */}
        <View style={styles.statusBadgeRow}>
          <View style={[styles.statusBadge, { backgroundColor: '#D4EDDA' }]}>
            <Text style={[styles.statusBadgeText, { color: '#155724' }]}>
              COMPLETE
            </Text>
          </View>
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
              {attempt.itemUsages.length} Component{attempt.itemUsages.length !== 1 ? 's' : ''} Used
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
            <PhotoGallery
              photoKeys={allPhotoKeys}
              mainPhotoKey={attempt.mainPhotoKey}
              initialIndex={photoGallery.initialIndex}
              onClose={() => setPhotoGallery({ isOpen: false, initialIndex: 0 })}
              onSetMain={handleSetMainPhoto}
              onDelete={handleDeletePhoto}
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
        </View>

        {/* Notes */}
        {attempt.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.card}>
              <Text style={styles.cardText}>{attempt.notes}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomAction, { paddingBottom: insets.bottom + spacing[4] }]}>
        <TouchableOpacity
          style={styles.saveExitButton}
          onPress={() => navigation.navigate('Tabs', { screen: 'Bakes' })}
        >
          <Icon name="save" color={colors.primary} size="md" />
          <Text style={styles.saveExitButtonText}>Save & Exit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={() => {
            setCaptureName(attempt.name);
            setCaptureModal(true);
          }}
        >
          <Icon name="verified" color={colors.white} size="md" />
          <Text style={styles.captureButtonText}>Capture</Text>
        </TouchableOpacity>
      </View>

      {/* Action Sheet */}
      <Modal isOpen={showActions} onClose={() => setShowActions(false)} title="Actions">
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

      {/* Capture Modal */}
      <Modal
        isOpen={captureModal}
        onClose={() => setCaptureModal(false)}
        title="Capture as Proofed"
      >
        <Text style={styles.captureHelp}>
          Save this attempt as a proven recipe in your Proofed collection.
        </Text>
        <Text style={styles.modalLabel}>Name</Text>
        <TextInput
          style={styles.input}
          value={captureName}
          onChangeText={setCaptureName}
          placeholder="e.g., My Perfect Vanilla Cake"
          placeholderTextColor={colors.dustyMauve}
        />
        <Text style={styles.modalLabel}>Notes</Text>
        <TextInput
          style={styles.textArea}
          value={captureNotes}
          onChangeText={setCaptureNotes}
          placeholder="Why does this combination work?"
          placeholderTextColor={colors.dustyMauve}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setCaptureModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!captureName.trim() || captureAttempt.isPending) && styles.buttonDisabled,
            ]}
            onPress={handleCapture}
            disabled={!captureName.trim() || captureAttempt.isPending}
          >
            <Text style={styles.submitButtonText}>Capture</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
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
        <Icon name="cake" size="sm" color={colors.primary} />
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
        <Icon name="image" color={colors.dustyMauve} size="md" />
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

function PhotoGallery({
  photoKeys,
  mainPhotoKey,
  initialIndex,
  onClose,
  onSetMain,
  onDelete,
}: {
  photoKeys: string[];
  mainPhotoKey?: string;
  initialIndex: number;
  onClose: () => void;
  onSetMain: (key: string) => void;
  onDelete: (key: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  const safeIndex = Math.min(currentIndex, photoKeys.length - 1);
  const currentPhotoKey = photoKeys[safeIndex];
  const isCurrentMain = currentPhotoKey === mainPhotoKey;

  React.useEffect(() => {
    if (currentIndex >= photoKeys.length && photoKeys.length > 0) {
      setCurrentIndex(photoKeys.length - 1);
    }
  }, [photoKeys.length, currentIndex]);

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setCurrentIndex(slideIndex);
  };

  return (
    <RNModal visible={true} transparent animationType="fade">
      <View style={[styles.galleryContainer, { backgroundColor: 'rgba(0,0,0,0.95)' }]}>
        {/* Header */}
        <View style={[styles.galleryHeader, { paddingTop: insets.top + spacing[2] }]}>
          <TouchableOpacity onPress={onClose} style={styles.galleryCloseButton}>
            <Icon name="close" size="lg" color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.galleryCounter}>
            {currentIndex + 1} / {photoKeys.length}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Photo Slider */}
        <FlatList
          ref={flatListRef}
          data={photoKeys}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          onMomentumScrollEnd={handleScroll}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <GalleryImage photoKey={item} width={screenWidth} height={screenHeight * 0.7} />
          )}
        />

        {/* Actions */}
        <View style={[styles.galleryActions, { paddingBottom: insets.bottom + spacing[4] }]}>
          <TouchableOpacity
            style={[styles.galleryAction, isCurrentMain && styles.galleryActionActive]}
            onPress={() => onSetMain(currentPhotoKey)}
            disabled={isCurrentMain}
          >
            <Icon name="star" size="md" color={isCurrentMain ? colors.primary : colors.white} />
            <Text style={[styles.galleryActionText, isCurrentMain && styles.galleryActionTextActive]}>
              {isCurrentMain ? 'Main Photo' : 'Set as Main'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.galleryAction}
            onPress={() => onDelete(currentPhotoKey)}
          >
            <Icon name="delete" size="md" color={colors.white} />
            <Text style={styles.galleryActionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </RNModal>
  );
}

function GalleryImage({ photoKey, width, height }: { photoKey: string; width: number; height: number }) {
  const { data: url, isLoading } = usePhotoUrl(photoKey);

  if (isLoading || !url) {
    return (
      <View style={[styles.galleryImageContainer, { width, height }]}>
        <Icon name="image" size="xl" color={colors.dustyMauve} />
      </View>
    );
  }

  return (
    <View style={[styles.galleryImageContainer, { width, height }]}>
      <Image
        source={{ uri: url }}
        style={styles.galleryImage}
        resizeMode="contain"
      />
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
  galleryContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  galleryCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryCounter: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.white,
  },
  galleryImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[8],
    paddingTop: spacing[4],
  },
  galleryAction: {
    alignItems: 'center',
    gap: spacing[1],
    padding: spacing[2],
  },
  galleryActionActive: {
    opacity: 0.7,
  },
  galleryActionText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.white,
  },
  galleryActionTextActive: {
    color: colors.primary,
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
  captureButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
  },
  captureButtonText: {
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
  captureHelp: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
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
});
