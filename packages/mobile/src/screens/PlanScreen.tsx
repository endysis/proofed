import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Icon, Modal, Loading } from '../components/common';
import { useAttempt, useUpdateAttempt, useDeleteAttempt } from '../hooks/useAttempts';
import { useItems } from '../hooks/useItems';
import { useRecipes } from '../hooks/useRecipes';
import { useVariants } from '../hooks/useVariants';
import { useItemUsageDetails, ItemUsageDetail } from '../hooks/useItemUsageDetails';
import { formatScaleFactor, getScaleOptions, calculateScaleFromIngredient } from '../utils/scaleRecipe';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../theme';
import ContainerScaleModal from '../components/scaling/ContainerScaleModal';
import type { RootStackParamList } from '../navigation/types';
import type { ItemUsage, Item, Recipe, Variant, Ingredient, ItemType } from '@proofed/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type PlanScreenRouteProp = RouteProp<RootStackParamList, 'PlanScreen'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ItemUsageInput {
  _key: string;
  itemId: string;
  recipeId: string;
  variantId?: string;
  scaleFactor?: number;
  notes?: string;
  shoppingListEnabled?: boolean;
  stockedIngredients?: string[];
  measurementEnabled?: boolean;
  measuredIngredients?: string[];
}

// Map item types to icons and section headers
const ITEM_TYPE_CONFIG: Record<ItemType, { icon: string; sectionName: string }> = {
  batter: { icon: 'cake', sectionName: 'SPONGES' },
  frosting: { icon: 'water_drop', sectionName: 'FROSTINGS' },
  filling: { icon: 'icecream', sectionName: 'FILLINGS' },
  dough: { icon: 'cookie', sectionName: 'DOUGHS' },
  glaze: { icon: 'format_paint', sectionName: 'GLAZES' },
  other: { icon: 'category', sectionName: 'OTHER' },
};

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PlanScreenRouteProp>();
  const { attemptId } = route.params;

  const { data: attempt, isLoading } = useAttempt(attemptId);
  const { data: items, isLoading: itemsLoading } = useItems();
  const updateAttempt = useUpdateAttempt();
  const deleteAttempt = useDeleteAttempt();

  const [showActions, setShowActions] = useState(false);
  const [editedUsages, setEditedUsages] = useState<ItemUsageInput[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const tempDateRef = useRef<Date>(new Date());

  // Add/Edit Item Modal State
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingUsageKey, setEditingUsageKey] = useState<string | null>(null);

  // Get details for all item usages (for displaying ingredients)
  const { details: usageDetails, isLoading: detailsLoading } = useItemUsageDetails(
    editedUsages.filter(u => u.itemId && u.recipeId)
  );

  // Track if we've initialized from the attempt
  const hasInitialized = useRef(false);

  // Initialize editable fields from attempt
  useEffect(() => {
    if (attempt && !hasInitialized.current) {
      setEditedUsages(
        attempt.itemUsages.map((u, i) => ({ ...u, _key: `existing-${i}` }))
      );
      setName(attempt.name);
      setDate(new Date(attempt.date));
      hasInitialized.current = true;
    }
  }, [attempt]);

  // Auto-save changes to DB (debounced)
  useEffect(() => {
    if (!hasInitialized.current || !hasChanges) return;

    const validUsages = editedUsages
      .filter((u) => u.itemId && u.recipeId)
      .map(({ _key, ...usage }) => usage);

    const timer = setTimeout(() => {
      updateAttempt.mutate(
        { attemptId, data: { itemUsages: validUsages, name, date: date.toISOString() } },
        { onSuccess: () => setHasChanges(false) }
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [editedUsages, name, date, hasChanges, attemptId]);

  const addItemUsage = (usage: ItemUsageInput) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditedUsages([...editedUsages, usage]);
    setHasChanges(true);
  };

  const updateItemUsage = (key: string, updates: Partial<ItemUsageInput>) => {
    setEditedUsages(
      editedUsages.map((usage) =>
        usage._key === key ? { ...usage, ...updates } : usage
      )
    );
    setHasChanges(true);
  };

  const removeItemUsage = (key: string) => {
    setEditedUsages(editedUsages.filter((usage) => usage._key !== key));
    setHasChanges(true);
  };

  const handleNameChange = (text: string) => {
    setName(text);
    setHasChanges(true);
  };

  const handleOpenDatePicker = () => {
    tempDateRef.current = date;
    setTempDate(date);
    setShowDatePicker(true);
  };

  const handleDateConfirm = () => {
    setDate(tempDateRef.current);
    setHasChanges(true);
    setShowDatePicker(false);
  };

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

  const handleSaveForLater = () => {
    const validUsages = editedUsages
      .filter((u) => u.itemId && u.recipeId)
      .map(({ _key, ...usage }) => usage);

    updateAttempt.mutate(
      {
        attemptId,
        data: {
          itemUsages: validUsages,
          name,
          date: date.toISOString(),
        },
      },
      {
        onSuccess: () => {
          setHasChanges(false);
          navigation.navigate('Tabs', { screen: 'Bakes' });
        },
      }
    );
  };

  const handleStartBaking = () => {
    const validUsages = editedUsages
      .filter((u) => u.itemId && u.recipeId)
      .map(({ _key, ...usage }) => usage);

    updateAttempt.mutate(
      {
        attemptId,
        data: {
          itemUsages: validUsages,
          name,
          date: date.toISOString(),
          status: 'baking',
        },
      },
      {
        onSuccess: () => {
          navigation.replace('BakeScreen', { attemptId });
        },
      }
    );
  };

  const handleOpenAddModal = () => {
    setEditingUsageKey(null);
    setShowAddItemModal(true);
  };

  const handleOpenEditModal = (key: string) => {
    setEditingUsageKey(key);
    setShowAddItemModal(true);
  };

  const handleToggleIngredient = (usageKey: string, ingredientName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditedUsages((prev) =>
      prev.map((usage) => {
        if (usage._key !== usageKey) return usage;
        const current = usage.stockedIngredients ?? [];
        const isStocked = current.includes(ingredientName);
        return {
          ...usage,
          stockedIngredients: isStocked
            ? current.filter((n: string) => n !== ingredientName)
            : [...current, ingredientName],
        };
      })
    );
    setHasChanges(true);
  };

  const handleModalSave = (usage: ItemUsageInput) => {
    if (editingUsageKey) {
      updateItemUsage(editingUsageKey, usage);
    } else {
      addItemUsage(usage);
    }
    setShowAddItemModal(false);
    setEditingUsageKey(null);
  };

  const handleModalRemove = () => {
    if (editingUsageKey) {
      removeItemUsage(editingUsageKey);
    }
    setShowAddItemModal(false);
    setEditingUsageKey(null);
  };

  const editingUsage = editingUsageKey
    ? editedUsages.find((u) => u._key === editingUsageKey)
    : undefined;

  if (isLoading || itemsLoading) return <Loading />;
  if (!attempt) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Attempt not found</Text>
      </View>
    );
  }

  // Build a map from usage key to details
  const validUsages = editedUsages.filter(u => u.itemId && u.recipeId);
  const usageDetailMap: Record<string, ItemUsageDetail> = {};
  validUsages.forEach((usage, index) => {
    if (usageDetails[index]) {
      usageDetailMap[usage._key] = usageDetails[index];
    }
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow_back_ios" color={colors.text} size="md" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planning Your Bake</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => setShowActions(true)}>
          <Icon name="more_vert" color={colors.text} size="md" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.mainContent} contentContainerStyle={styles.mainContentContainer} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={styles.statusBadgeRow}>
          <View style={[styles.statusBadge, { backgroundColor: colors.pastelPink }]}>
            <Text style={[styles.statusBadgeText, { color: colors.primary }]}>
              PLAN
            </Text>
          </View>
        </View>

        {/* Title & Date */}
        <View style={styles.titleSection}>
          <TextInput
            style={styles.titleInput}
            value={name}
            onChangeText={handleNameChange}
            placeholder="Bake name"
            placeholderTextColor={colors.dustyMauve}
          />
          <TouchableOpacity style={styles.dateRow} onPress={handleOpenDatePicker}>
            <Icon name="calendar_today" size="sm" color={colors.dustyMauve} />
            <Text style={styles.date}>
              {date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Icon name="edit" size="sm" color={colors.dustyMauve} />
          </TouchableOpacity>
        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleOpenAddModal}>
              <Icon name="add" size="sm" color={colors.primary} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {editedUsages.length === 0 ? (
            <TouchableOpacity style={styles.emptyCard} onPress={handleOpenAddModal}>
              <Icon name="add_circle" size="xl" color={colors.primary} />
              <Text style={styles.emptyCardText}>Add your first item</Text>
            </TouchableOpacity>
          ) : (
            editedUsages
              .filter((u) => u.itemId && u.recipeId)
              .map((usage) => {
                const detail = usageDetailMap[usage._key];
                return (
                  <PlanItemTile
                    key={usage._key}
                    usage={usage}
                    detail={detail}
                    onEdit={() => handleOpenEditModal(usage._key)}
                    onToggleIngredient={(ingredientName) =>
                      handleToggleIngredient(usage._key, ingredientName)
                    }
                  />
                );
              })
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Area */}
      <View style={[styles.bottomAction, { paddingBottom: insets.bottom + spacing[4] }]}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSaveForLater}
          disabled={updateAttempt.isPending}
        >
          <Icon name="save" color={colors.primary} size="md" />
          <Text style={styles.secondaryButtonText}>Save for Later</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleStartBaking}
          disabled={updateAttempt.isPending}
        >
          <Icon name="play_arrow" color={colors.white} size="md" />
          <Text style={styles.primaryButtonText}>Start Baking</Text>
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

      {/* iOS Date Picker Modal */}
      {Platform.OS === 'ios' && showDatePicker && (
        <>
          <TouchableOpacity
            style={styles.datePickerBackdrop}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          />
          <View style={[styles.datePickerSheet, { paddingBottom: insets.bottom }]}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.datePickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDateConfirm}>
                <Text style={styles.datePickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={(_, selectedDate) => {
                if (selectedDate) {
                  tempDateRef.current = selectedDate;
                  setTempDate(selectedDate);
                }
              }}
              style={styles.datePicker}
            />
          </View>
        </>
      )}

      {/* Android Date Picker */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDate(selectedDate);
              setHasChanges(true);
            }
          }}
        />
      )}

      {/* Add/Edit Item Modal */}
      <AddItemModal
        isOpen={showAddItemModal}
        onClose={() => {
          setShowAddItemModal(false);
          setEditingUsageKey(null);
        }}
        onSave={handleModalSave}
        onRemove={editingUsageKey ? handleModalRemove : undefined}
        editingUsage={editingUsage}
        items={items || []}
      />
    </View>
  );
}

// ============================================================================
// PlanItemTile Component - Shows item with ingredients
// ============================================================================

function PlanItemTile({
  usage,
  detail,
  onEdit,
  onToggleIngredient,
}: {
  usage: ItemUsageInput;
  detail?: ItemUsageDetail;
  onEdit: () => void;
  onToggleIngredient: (ingredientName: string) => void;
}) {
  const [notesExpanded, setNotesExpanded] = useState(false);

  if (!detail) {
    return (
      <View style={styles.itemTile}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const { itemName, itemType, recipeName, variantName, scaleFactor, ingredients } = detail;
  const typeConfig = ITEM_TYPE_CONFIG[itemType] || ITEM_TYPE_CONFIG.other;
  const shoppingListEnabled = usage.shoppingListEnabled ?? false;
  const stockedIngredients = usage.stockedIngredients ?? [];

  return (
    <View style={styles.itemTile}>
      {/* Header */}
      <View style={styles.tileHeader}>
        <View style={styles.tileIconRow}>
          <View style={styles.tileIcon}>
            <Icon name={typeConfig.icon} size="sm" color={colors.primary} />
          </View>
          <View style={styles.tileTitleContent}>
            <Text style={styles.tileTitle}>{itemName}</Text>
            <Text style={styles.tileSubtitle}>
              {recipeName}
              {variantName ? ` • ${variantName}` : ''}
            </Text>
            <Text style={scaleFactor !== 1 ? styles.scaledLabel : styles.standardBatchLabel}>
              {scaleFactor !== 1 ? `Scaled ${formatScaleFactor(scaleFactor)}` : 'STANDARD BATCH'}
            </Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Icon name="edit" size="sm" color={colors.dustyMauve} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Ingredients List */}
      <View style={styles.ingredientsList}>
        {ingredients.map((ing) => {
          const isStocked = stockedIngredients.includes(ing.name);

          if (shoppingListEnabled) {
            return (
              <TouchableOpacity
                key={ing.name}
                style={styles.ingredientRowCheckable}
                onPress={() => onToggleIngredient(ing.name)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, isStocked && styles.checkboxChecked]}>
                  {isStocked && (
                    <Icon name="check" size="sm" color={colors.white} />
                  )}
                </View>
                <Text
                  style={[
                    styles.ingredientName,
                    isStocked && styles.ingredientNameStocked,
                  ]}
                >
                  {ing.name}
                </Text>
                <Text
                  style={[
                    styles.ingredientQuantity,
                    isStocked && styles.ingredientQuantityStocked,
                  ]}
                >
                  {ing.quantity}{ing.unit}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <View key={ing.name} style={styles.ingredientRow}>
              <Text style={styles.ingredientName}>{ing.name}</Text>
              <Text style={styles.ingredientQuantity}>
                {ing.quantity}{ing.unit}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Collapsible Notes Section */}
      {usage.notes && (
        <View style={styles.notesSection}>
          <TouchableOpacity
            style={styles.notesToggle}
            onPress={() => setNotesExpanded(!notesExpanded)}
          >
            <Icon name="notes" size="sm" color={colors.dustyMauve} />
            <Text style={styles.notesToggleText}>Notes</Text>
            <Icon
              name={notesExpanded ? 'expand_less' : 'expand_more'}
              size="sm"
              color={colors.dustyMauve}
            />
          </TouchableOpacity>

          {notesExpanded && (
            <View style={styles.notesContent}>
              <Text style={styles.notesText}>{usage.notes}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// AddItemModal Component - Modal for adding/editing items
// ============================================================================

function AddItemModal({
  isOpen,
  onClose,
  onSave,
  onRemove,
  editingUsage,
  items,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (usage: ItemUsageInput) => void;
  onRemove?: () => void;
  editingUsage?: ItemUsageInput;
  items: Item[];
}) {
  const [itemId, setItemId] = useState('');
  const [recipeId, setRecipeId] = useState('');
  const [variantId, setVariantId] = useState<string | undefined>();
  const [scaleFactor, setScaleFactor] = useState<number | undefined>();
  const [notes, setNotes] = useState('');
  const [shoppingListEnabled, setShoppingListEnabled] = useState(false);
  const [measurementEnabled, setMeasurementEnabled] = useState(false);

  // Sub-modal states
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [showVariantPicker, setShowVariantPicker] = useState(false);
  const [showScaleByIngredient, setShowScaleByIngredient] = useState(false);
  const [showContainerScale, setShowContainerScale] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [ingredientAmount, setIngredientAmount] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  // Fetch recipes and variants based on selection
  const { data: recipes } = useRecipes(itemId);
  const { data: variants } = useVariants(itemId, recipeId);
  const { details } = useItemUsageDetails(
    itemId && recipeId ? [{ itemId, recipeId, variantId }] : []
  );
  const currentDetail = details[0];

  // Initialize form when editing
  useEffect(() => {
    if (isOpen) {
      if (editingUsage) {
        setItemId(editingUsage.itemId);
        setRecipeId(editingUsage.recipeId);
        setVariantId(editingUsage.variantId);
        setScaleFactor(editingUsage.scaleFactor);
        setNotes(editingUsage.notes || '');
        setShoppingListEnabled(editingUsage.shoppingListEnabled ?? false);
        setMeasurementEnabled(editingUsage.measurementEnabled ?? false);
      } else {
        setItemId('');
        setRecipeId('');
        setVariantId(undefined);
        setScaleFactor(undefined);
        setNotes('');
        setShoppingListEnabled(false);
        setMeasurementEnabled(false);
      }
      setItemSearch('');
    }
  }, [isOpen, editingUsage]);

  // Reset recipe/variant when item changes (but not on initial load)
  useEffect(() => {
    if (itemId && (!editingUsage || itemId !== editingUsage.itemId)) {
      setRecipeId('');
      setVariantId(undefined);
    }
  }, [itemId, editingUsage]);

  // Reset variant when recipe changes (but not on initial load)
  useEffect(() => {
    if (recipeId && (!editingUsage || recipeId !== editingUsage.recipeId)) {
      setVariantId(undefined);
    }
  }, [recipeId, editingUsage]);

  const selectedItem = items.find((i) => i.itemId === itemId);
  const selectedRecipe = recipes?.find((r) => r.recipeId === recipeId);
  const selectedVariant = variants?.find((v) => v.variantId === variantId);

  const handleSave = () => {
    const key = editingUsage?._key || Date.now().toString();
    onSave({
      _key: key,
      itemId,
      recipeId,
      variantId,
      scaleFactor,
      notes: notes || undefined,
      shoppingListEnabled,
      stockedIngredients: editingUsage?.stockedIngredients,
      measurementEnabled,
      measuredIngredients: editingUsage?.measuredIngredients,
    });
  };

  // Group items by type for the picker
  const groupedItems = items.reduce((acc, item) => {
    const type = item.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<ItemType, Item[]>);

  // Filter items by search
  const filteredGroupedItems = Object.entries(groupedItems).reduce((acc, [type, typeItems]) => {
    const filtered = typeItems.filter((item) =>
      item.name.toLowerCase().includes(itemSearch.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[type as ItemType] = filtered;
    }
    return acc;
  }, {} as Record<ItemType, Item[]>);

  const canSave = itemId && recipeId;

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingUsage ? 'Edit Item' : 'Add Item'}
    >
      {/* Item Picker */}
      <View style={styles.modalField}>
        <Text style={styles.modalLabel}>Item</Text>
        <TouchableOpacity style={styles.modalPicker} onPress={() => setShowItemPicker(true)}>
          <Text style={[styles.modalPickerText, !selectedItem && styles.modalPickerPlaceholder]}>
            {selectedItem?.name || 'Select item...'}
          </Text>
          <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
        </TouchableOpacity>
      </View>

      {/* Recipe Picker */}
      {itemId && (
        <View style={styles.modalField}>
          <Text style={styles.modalLabel}>Recipe</Text>
          <TouchableOpacity style={styles.modalPicker} onPress={() => setShowRecipePicker(true)}>
            <Text style={[styles.modalPickerText, !selectedRecipe && styles.modalPickerPlaceholder]}>
              {selectedRecipe?.name || 'Select recipe...'}
            </Text>
            <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
          </TouchableOpacity>
        </View>
      )}

      {/* Variant Picker */}
      {recipeId && variants && variants.length > 0 && (
        <View style={styles.modalField}>
          <Text style={styles.modalLabel}>Variant (optional)</Text>
          <TouchableOpacity style={styles.modalPicker} onPress={() => setShowVariantPicker(true)}>
            <Text style={[styles.modalPickerText, !selectedVariant && styles.modalPickerPlaceholder]}>
              {selectedVariant?.name || 'Base recipe'}
            </Text>
            <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
          </TouchableOpacity>
        </View>
      )}

      {/* Scale Selector */}
      {recipeId && (
        <View style={styles.modalField}>
          <Text style={styles.modalLabel}>Scale</Text>
          <View style={styles.scaleButtons}>
            {getScaleOptions(selectedRecipe?.customScales).map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.scaleButton,
                  (scaleFactor ?? 1) === option.value && styles.scaleButtonActive,
                ]}
                onPress={() => setScaleFactor(option.value === 1 ? undefined : option.value)}
              >
                <Text
                  style={[
                    styles.scaleButtonText,
                    (scaleFactor ?? 1) === option.value && styles.scaleButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Scale by ingredient and container buttons */}
          <View style={styles.scaleByRow}>
            <TouchableOpacity
              style={styles.scaleByButton}
              onPress={() => setShowScaleByIngredient(true)}
            >
              <Icon name="calculate" size="sm" color={colors.primary} />
              <Text style={styles.scaleByButtonText}>By Ingredient</Text>
            </TouchableOpacity>
            {selectedRecipe?.container && (
              <TouchableOpacity
                style={styles.scaleByButton}
                onPress={() => setShowContainerScale(true)}
              >
                <Icon name="auto_awesome" size="sm" color={colors.primary} />
                <Text style={styles.scaleByButtonText}>By Container</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Show applied custom scale indicator */}
          {scaleFactor && !getScaleOptions(selectedRecipe?.customScales).some(opt => opt.value === scaleFactor) && (
            <View style={styles.customScaleBadge}>
              <Icon name="check_circle" size="sm" color={colors.success} />
              <Text style={styles.customScaleBadgeText}>
                Bespoke scale applied: {formatScaleFactor(scaleFactor)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Notes */}
      <View style={styles.modalField}>
        <Text style={styles.modalLabel}>Notes for this item</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Tap to add notes..."
          placeholderTextColor={colors.dustyMauve}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Shopping List Mode */}
      <View style={styles.modalField}>
        <View style={styles.shoppingListToggleRow}>
          <View style={styles.shoppingListToggleContent}>
            <Text style={styles.modalLabel}>Shopping List Mode</Text>
            <Text style={styles.shoppingListHint}>
              Track which ingredients you have in stock
            </Text>
          </View>
          <Switch
            value={shoppingListEnabled}
            onValueChange={setShoppingListEnabled}
            trackColor={{ false: colors.bgLight, true: colors.pastelPink }}
            thumbColor={shoppingListEnabled ? colors.primary : colors.dustyMauve}
          />
        </View>
      </View>

      {/* Measurement Mode */}
      <View style={styles.modalField}>
        <View style={styles.shoppingListToggleRow}>
          <View style={styles.shoppingListToggleContent}>
            <Text style={styles.modalLabel}>Measurement Mode</Text>
            <Text style={styles.shoppingListHint}>
              Track ingredients as you measure them during baking
            </Text>
          </View>
          <Switch
            value={measurementEnabled}
            onValueChange={setMeasurementEnabled}
            trackColor={{ false: colors.bgLight, true: colors.pastelPink }}
            thumbColor={measurementEnabled ? colors.primary : colors.dustyMauve}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.modalButtons}>
        {onRemove && (
          <TouchableOpacity style={styles.removeItemButton} onPress={onRemove}>
            <Icon name="delete" size="sm" color={colors.primary} />
            <Text style={styles.removeItemButtonText}>Remove</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.modalCancelButton}
          onPress={onClose}
        >
          <Text style={styles.modalCancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalSaveButton, !canSave && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={styles.modalSaveButtonText}>
            {editingUsage ? 'Save Changes' : 'Add Item'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Item Picker Sub-Modal */}
      <Modal
        isOpen={showItemPicker}
        onClose={() => {
          setShowItemPicker(false);
          setItemSearch('');
        }}
        title="Select Item"
      >
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Icon name="search" size="sm" color={colors.dustyMauve} />
          <TextInput
            style={styles.searchInput}
            value={itemSearch}
            onChangeText={setItemSearch}
            placeholder="Search items..."
            placeholderTextColor={colors.dustyMauve}
            autoFocus
          />
          {itemSearch.length > 0 && (
            <TouchableOpacity onPress={() => setItemSearch('')}>
              <Icon name="close" size="sm" color={colors.dustyMauve} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.pickerList}>
          {Object.entries(filteredGroupedItems).map(([type, typeItems]) => {
            const typeConfig = ITEM_TYPE_CONFIG[type as ItemType];
            return (
              <View key={type}>
                <Text style={styles.pickerSectionHeader}>{typeConfig.sectionName}</Text>
                {typeItems.map((item) => (
                  <TouchableOpacity
                    key={item.itemId}
                    style={styles.pickerOption}
                    onPress={() => {
                      setItemId(item.itemId);
                      setShowItemPicker(false);
                      setItemSearch('');
                    }}
                  >
                    <Icon name={typeConfig.icon} size="sm" color={colors.dustyMauve} />
                    <Text style={styles.pickerOptionText}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </Modal>

      {/* Recipe Picker Sub-Modal */}
      <Modal
        isOpen={showRecipePicker}
        onClose={() => setShowRecipePicker(false)}
        title="Select Recipe"
      >
        <ScrollView style={styles.pickerList}>
          {(recipes || []).map((recipe) => (
            <TouchableOpacity
              key={recipe.recipeId}
              style={styles.pickerOption}
              onPress={() => {
                setRecipeId(recipe.recipeId);
                setShowRecipePicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>{recipe.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>

      {/* Variant Picker Sub-Modal */}
      <Modal
        isOpen={showVariantPicker}
        onClose={() => setShowVariantPicker(false)}
        title="Select Variant"
      >
        <ScrollView style={styles.pickerList}>
          <TouchableOpacity
            style={styles.pickerOption}
            onPress={() => {
              setVariantId(undefined);
              setShowVariantPicker(false);
            }}
          >
            <Text style={styles.pickerOptionText}>Base recipe</Text>
          </TouchableOpacity>
          {(variants || []).map((variant) => (
            <TouchableOpacity
              key={variant.variantId}
              style={styles.pickerOption}
              onPress={() => {
                setVariantId(variant.variantId);
                setShowVariantPicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>{variant.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>

      {/* Scale by Ingredient Sub-Modal */}
      <Modal
        isOpen={showScaleByIngredient}
        onClose={() => {
          setShowScaleByIngredient(false);
          setSelectedIngredient(null);
          setIngredientAmount('');
        }}
        title="Scale by Ingredient"
      >
        <Text style={styles.modalLabel}>Select ingredient</Text>
        <ScrollView style={styles.ingredientList}>
          {(currentDetail?.baseIngredients || []).map((ing) => (
            <TouchableOpacity
              key={ing.name}
              style={[
                styles.ingredientOption,
                selectedIngredient?.name === ing.name && styles.ingredientOptionActive,
              ]}
              onPress={() => setSelectedIngredient(ing)}
            >
              <Text style={styles.ingredientOptionName}>{ing.name}</Text>
              <Text style={styles.ingredientOptionAmount}>
                {ing.quantity} {ing.unit}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedIngredient && (
          <>
            <Text style={styles.modalLabel}>
              How much {selectedIngredient.name.toLowerCase()} do you have?
            </Text>
            <View style={styles.amountInputRow}>
              <TextInput
                style={styles.amountInput}
                value={ingredientAmount}
                onChangeText={setIngredientAmount}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.dustyMauve}
              />
              <Text style={styles.unitLabel}>{selectedIngredient.unit}</Text>
            </View>

            {ingredientAmount && parseFloat(ingredientAmount) > 0 && (
              <View style={styles.scalePreview}>
                <Text style={styles.scalePreviewLabel}>Recipe will scale to:</Text>
                <Text style={styles.scalePreviewValue}>
                  {formatScaleFactor(calculateScaleFromIngredient(
                    selectedIngredient.quantity,
                    parseFloat(ingredientAmount)
                  ))}
                </Text>
              </View>
            )}
          </>
        )}

        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => {
              setShowScaleByIngredient(false);
              setSelectedIngredient(null);
              setIngredientAmount('');
            }}
          >
            <Text style={styles.modalCancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalSaveButton,
              (!selectedIngredient || !ingredientAmount || parseFloat(ingredientAmount) <= 0) && styles.buttonDisabled,
            ]}
            onPress={() => {
              const scale = calculateScaleFromIngredient(
                selectedIngredient!.quantity,
                parseFloat(ingredientAmount)
              );
              setScaleFactor(scale === 1 ? undefined : scale);
              setShowScaleByIngredient(false);
              setSelectedIngredient(null);
              setIngredientAmount('');
            }}
            disabled={!selectedIngredient || !ingredientAmount || parseFloat(ingredientAmount) <= 0}
          >
            <Text style={styles.modalSaveButtonText}>Apply Scale</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Scale by Container Modal */}
      {selectedRecipe?.container && currentDetail && (
        <ContainerScaleModal
          isOpen={showContainerScale}
          onClose={() => setShowContainerScale(false)}
          onApply={(newScaleFactor) => {
            setScaleFactor(newScaleFactor === 1 ? undefined : newScaleFactor);
          }}
          sourceContainer={selectedRecipe.container}
          recipeId={selectedRecipe.recipeId}
          context={{
            itemName: selectedItem?.name || '',
            itemType: (selectedItem?.type || 'batter') as ItemType,
            recipeName: selectedRecipe.name,
            ingredients: currentDetail.baseIngredients,
            bakeTime: selectedRecipe.bakeTime,
            bakeTemp: selectedRecipe.bakeTemp,
            bakeTempUnit: selectedRecipe.bakeTempUnit,
          }}
        />
      )}
    </Modal>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  mainContentContainer: {
    paddingBottom: 120,
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
  titleInput: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    color: colors.text,
    padding: 0,
    borderWidth: 0,
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
    flex: 1,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
  },
  addButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.pastelPink,
    padding: spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  emptyCardText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.primary,
  },
  // Item Tile Styles
  itemTile: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  tileHeader: {
    marginBottom: spacing[3],
  },
  tileIconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  tileTitleContent: {
    flex: 1,
  },
  tileTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
  },
  tileSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    marginTop: spacing[1],
  },
  scaledLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
    marginTop: spacing[1],
  },
  standardBatchLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    marginTop: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editButton: {
    padding: spacing[2],
  },
  ingredientsList: {
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  ingredientRowCheckable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.dustyMauve,
    marginRight: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  ingredientName: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  ingredientNameStocked: {
    textDecorationLine: 'line-through',
    color: colors.dustyMauve,
  },
  ingredientQuantity: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  ingredientQuantityStocked: {
    textDecorationLine: 'line-through',
  },
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    textAlign: 'center',
  },
  notesSection: {
    marginTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: spacing[3],
  },
  notesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  notesToggleText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  notesContent: {
    marginTop: spacing[2],
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
  },
  notesText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: fontSize.sm * 1.5,
  },
  // Modal Styles
  modalField: {
    marginBottom: spacing[4],
  },
  modalLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing[2],
  },
  modalPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.xl,
    height: 48,
    paddingHorizontal: spacing[4],
  },
  modalPickerText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  modalPickerPlaceholder: {
    color: colors.dustyMauve,
  },
  scaleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
  },
  scaleButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
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
  scaleByRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  scaleByButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  scaleByButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  customScaleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
  },
  customScaleBadgeText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.success,
  },
  notesInput: {
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  shoppingListToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shoppingListToggleContent: {
    flex: 1,
    marginRight: spacing[3],
  },
  shoppingListHint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    marginTop: spacing[1],
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
  },
  modalSaveButton: {
    flex: 2,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.white,
  },
  removeItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  removeItemButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Picker Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    height: 48,
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerSectionHeader: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.bgLight,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  pickerOptionText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  // Scale by Ingredient Styles
  ingredientList: {
    maxHeight: 200,
    marginBottom: spacing[4],
  },
  ingredientOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: colors.white,
  },
  ingredientOptionActive: {
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
  },
  ingredientOptionName: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.text,
  },
  ingredientOptionAmount: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  amountInput: {
    flex: 1,
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.xl,
    height: 56,
    paddingHorizontal: spacing[4],
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.text,
    textAlign: 'center',
  },
  unitLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.lg,
    color: colors.dustyMauve,
    minWidth: 40,
  },
  scalePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[4],
  },
  scalePreviewLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  scalePreviewValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.primary,
  },
  // Bottom Actions
  bottomAction: {
    padding: spacing[4],
    backgroundColor: colors.bgLight,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    flexDirection: 'row',
    gap: spacing[3],
  },
  secondaryButton: {
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
  secondaryButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.primary,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
  },
  primaryButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.white,
  },
  // Action Sheet
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
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.error,
    padding: spacing[4],
  },
  // Date Picker
  datePickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  datePickerCancel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.dustyMauve,
  },
  datePickerDone: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.primary,
  },
  datePicker: {
    height: 200,
  },
});
