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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Icon, Modal, Loading } from '../components/common';
import { PhotoUpload } from '../components/photos';
import { useAttempt, useUpdateAttempt, useDeleteAttempt, useCaptureAttempt } from '../hooks/useAttempts';
import { useItem } from '../hooks/useItems';
import { useRecipe } from '../hooks/useRecipes';
import { useVariant } from '../hooks/useVariants';
import { usePhotoUpload, usePhotoUrl } from '../hooks/usePhotos';
import { formatScaleFactor } from '../utils/scaleRecipe';
import { formatContainer } from '../constants/containers';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { ItemUsage } from '@proofed/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type AttemptDetailRouteProp = RouteProp<RootStackParamList, 'AttemptDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AttemptDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AttemptDetailRouteProp>();
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

  const handlePhotoUpload = async (imageUri: string) => {
    try {
      const key = await photoUpload.mutateAsync({ attemptId, imageUri });
      const photoKeys = [...(attempt?.photoKeys || []), key];
      updateAttempt.mutate({ attemptId, data: { photoKeys } });
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  if (isLoading) return <Loading />;
  if (!attempt) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Attempt not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow_back_ios" color={colors.text} size="md" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bake Details</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => setShowActions(true)}>
          <Icon name="more_vert" color={colors.text} size="md" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
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

        {/* Notes */}
        {attempt.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.card}>
              <Text style={styles.cardText}>{attempt.notes}</Text>
            </View>
          </View>
        )}

        {/* Items Used */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items Used</Text>
          {attempt.itemUsages.length > 0 ? (
            attempt.itemUsages.map((usage, index) => (
              <ItemUsageDisplay key={index} usage={usage} />
            ))
          ) : (
            <View style={styles.card}>
              <Text style={styles.emptyText}>No items recorded</Text>
            </View>
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

        {/* Photos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <PhotoUpload onUpload={handlePhotoUpload} isLoading={photoUpload.isPending} />
          </View>
          {attempt.photoKeys && attempt.photoKeys.length > 0 ? (
            <View style={styles.photoGrid}>
              {attempt.photoKeys.map((key, index) => (
                <PhotoThumbnail key={index} photoKey={key} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyPhotos}>
              <Icon name="add_a_photo" size="xl" color={colors.dustyMauve} />
              <Text style={styles.emptyText}>No photos yet</Text>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomAction, { paddingBottom: insets.bottom + spacing[4] }]}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={() => {
            setCaptureName(attempt.name);
            setCaptureModal(true);
          }}
        >
          <Icon name="verified" color={colors.white} size="md" />
          <Text style={styles.captureButtonText}>Capture as Proofed</Text>
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

function PhotoThumbnail({ photoKey }: { photoKey: string }) {
  const { data: url, isLoading } = usePhotoUrl(photoKey);

  if (isLoading || !url) {
    return (
      <View style={styles.photoPlaceholder}>
        <Icon name="image" color={colors.dustyMauve} size="md" />
      </View>
    );
  }

  return <Image source={{ uri: url }} style={styles.photo} />;
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
    marginBottom: spacing[3],
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
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  photo: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: borderRadius.xl,
  },
  photoPlaceholder: {
    width: '31%',
    aspectRatio: 1,
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
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[4],
    backgroundColor: colors.bgLight,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  captureButton: {
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
