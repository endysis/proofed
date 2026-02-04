import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Icon, Modal, Loading } from '../components/common';
import { useProofedItem, useUpdateProofedItem, useDeleteProofedItem } from '../hooks/useProofedItems';
import { useItem } from '../hooks/useItems';
import { useRecipe } from '../hooks/useRecipes';
import { useVariant } from '../hooks/useVariants';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { ItemUsage } from '@proofed/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ProofedItemDetailRouteProp = RouteProp<RootStackParamList, 'ProofedItemDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProofedItemDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ProofedItemDetailRouteProp>();
  const { proofedItemId } = route.params;

  const { data: proofedItem, isLoading } = useProofedItem(proofedItemId);
  const updateProofedItem = useUpdateProofedItem();
  const deleteProofedItem = useDeleteProofedItem();

  const [showActions, setShowActions] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const handleDelete = () => {
    Alert.alert('Delete Proofed Item', 'Are you sure you want to delete this proofed item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteProofedItem.mutate(proofedItemId, { onSuccess: () => navigation.goBack() });
        },
      },
    ]);
  };

  const handleSave = () => {
    updateProofedItem.mutate(
      { proofedItemId, data: { name: editName, notes: editNotes || undefined } },
      { onSuccess: () => setEditModal(false) }
    );
  };

  if (isLoading) return <Loading />;
  if (!proofedItem) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Proofed item not found</Text>
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
        <Text style={styles.headerTitle}>Proofed Recipe</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => setShowActions(true)}>
          <Icon name="more_vert" color={colors.text} size="md" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name="verified" size="xl" color={colors.primary} />
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>PROVEN RECIPE</Text>
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{proofedItem.name}</Text>
          {proofedItem.notes && (
            <Text style={styles.notes}>{proofedItem.notes}</Text>
          )}
          <View style={styles.dateRow}>
            <Icon name="calendar_today" size="sm" color={colors.dustyMauve} />
            <Text style={styles.date}>
              Created {new Date(proofedItem.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Item Configurations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipe Configuration</Text>
          <Text style={styles.sectionSubtitle}>
            The proven item + recipe + variant combinations
          </Text>
          {proofedItem.itemConfigs.map((config, index) => (
            <ItemConfigDisplay key={index} config={config} />
          ))}
        </View>

        {/* Link to Original Attempt */}
        {proofedItem.capturedFromAttemptId && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.attemptLink}
              onPress={() =>
                navigation.navigate('AttemptDetail', {
                  attemptId: proofedItem.capturedFromAttemptId!,
                })
              }
            >
              <View style={styles.attemptLinkIcon}>
                <Icon name="history" size="sm" color={colors.dustyMauve} />
              </View>
              <View style={styles.attemptLinkInfo}>
                <Text style={styles.attemptLinkTitle}>View Original Attempt</Text>
                <Text style={styles.attemptLinkSubtitle}>See the bake that created this</Text>
              </View>
              <Icon name="chevron_right" color={colors.dustyMauve} size="md" />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: spacing[6] }} />
      </ScrollView>

      {/* Action Sheet */}
      <Modal isOpen={showActions} onClose={() => setShowActions(false)} title="Actions">
        <View style={styles.actionSheet}>
          <TouchableOpacity
            style={styles.actionOption}
            onPress={() => {
              setShowActions(false);
              setEditName(proofedItem.name);
              setEditNotes(proofedItem.notes || '');
              setEditModal(true);
            }}
          >
            <Icon name="edit" color={colors.dustyMauve} size="md" />
            <Text style={styles.actionOptionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionOption}
            onPress={() => {
              setShowActions(false);
              handleDelete();
            }}
          >
            <Icon name="delete" color={colors.primary} size="md" />
            <Text style={[styles.actionOptionText, { color: colors.primary }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Proofed Item">
        <View style={styles.editForm}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={editName}
            onChangeText={setEditName}
            placeholder="Recipe name"
            placeholderTextColor={colors.dustyMauve}
            autoFocus
          />

          <Text style={[styles.label, { marginTop: spacing[4] }]}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={editNotes}
            onChangeText={setEditNotes}
            placeholder="Why does this combination work?"
            placeholderTextColor={colors.dustyMauve}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setEditModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!editName.trim() || updateProofedItem.isPending) && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={!editName.trim() || updateProofedItem.isPending}
            >
              <Text style={styles.submitButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ItemConfigDisplay({ config }: { config: ItemUsage }) {
  const navigation = useNavigation<NavigationProp>();
  const { data: item } = useItem(config.itemId);
  const { data: recipe } = useRecipe(config.itemId, config.recipeId);
  const { data: variant } = useVariant(config.itemId, config.recipeId, config.variantId || '');
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.configCard}>
      <TouchableOpacity
        style={styles.configHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.configIcon}>
          <Icon name="cake" size="sm" color={colors.primary} />
        </View>
        <View style={styles.configInfo}>
          <Text style={styles.configName}>{item?.name || 'Loading...'}</Text>
          <Text style={styles.configDetails}>
            {recipe?.name || 'Loading...'}
            {variant && <Text style={styles.configHighlight}> • {variant.name}</Text>}
          </Text>
        </View>
        <Icon
          name={expanded ? 'expand_less' : 'expand_more'}
          color={colors.dustyMauve}
          size="md"
        />
      </TouchableOpacity>

      {config.notes && (
        <Text style={styles.configNotes}>{config.notes}</Text>
      )}

      {expanded && recipe && (
        <View style={styles.ingredientsList}>
          <Text style={styles.ingredientsLabel}>INGREDIENTS</Text>
          {recipe.ingredients.map((ing, i) => {
            const override = variant?.ingredientOverrides.find(
              (o) => o.name.toLowerCase() === ing.name.toLowerCase()
            );
            return (
              <View key={i} style={styles.ingredientRow}>
                <Text
                  style={[
                    styles.ingredientName,
                    override && styles.ingredientModified,
                  ]}
                >
                  {ing.name}
                  {override && ' *'}
                </Text>
                <Text style={styles.ingredientQty}>
                  {override ? override.quantity : ing.quantity}{' '}
                  {override ? override.unit : ing.unit}
                </Text>
              </View>
            );
          })}
          {variant && variant.ingredientOverrides.length > 0 && (
            <Text style={styles.modifiedNote}>* Modified from base recipe</Text>
          )}

          <TouchableOpacity
            style={styles.viewRecipeLink}
            onPress={() => navigation.navigate('ItemDetail', { itemId: config.itemId })}
          >
            <Text style={styles.viewRecipeLinkText}>View full recipe</Text>
            <Icon name="chevron_right" size="sm" color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}
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
  hero: {
    paddingVertical: spacing[8],
    alignItems: 'center',
    backgroundColor: 'rgba(229, 52, 78, 0.05)',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  heroBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.primary,
    letterSpacing: 1,
  },
  titleSection: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    color: colors.text,
  },
  notes: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    marginTop: spacing[2],
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[2],
  },
  date: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
  },
  section: {
    marginTop: spacing[6],
    paddingHorizontal: spacing[4],
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },
  sectionSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    marginBottom: spacing[4],
  },
  configCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: spacing[3],
    overflow: 'hidden',
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  configIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  configInfo: {
    flex: 1,
  },
  configName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  configDetails: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
  },
  configHighlight: {
    color: colors.primary,
    fontFamily: fontFamily.medium,
  },
  configNotes: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    marginLeft: 52,
  },
  ingredientsList: {
    backgroundColor: 'rgba(248, 246, 246, 0.5)',
    borderTopWidth: 1,
    borderTopColor: colors.bgLight,
    padding: spacing[4],
  },
  ingredientsLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    letterSpacing: 0.5,
    marginBottom: spacing[3],
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  ingredientName: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  ingredientModified: {
    color: colors.primary,
    fontFamily: fontFamily.medium,
  },
  ingredientQty: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  modifiedNote: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: spacing[3],
  },
  viewRecipeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  viewRecipeLinkText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  attemptLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    padding: spacing[4],
  },
  attemptLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(157, 129, 137, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  attemptLinkInfo: {
    flex: 1,
  },
  attemptLinkTitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  attemptLinkSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
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
  editForm: {},
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing[2],
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
    height: 100,
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    textAlignVertical: 'top',
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
