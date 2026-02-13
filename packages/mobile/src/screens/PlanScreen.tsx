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
  Dimensions,
} from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Icon, Modal, Loading } from '../components/common';
import { useAttempt, useUpdateAttempt, useDeleteAttempt } from '../hooks/useAttempts';
import { useItems, useItem } from '../hooks/useItems';
import { useRecipes, useRecipe } from '../hooks/useRecipes';
import { useVariants, useVariant } from '../hooks/useVariants';
import { formatScaleFactor, getScaleOptions, calculateScaleFromIngredient } from '../utils/scaleRecipe';
import { mergeIngredients } from '../utils/mergeIngredients';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../theme';
import ContainerScaleModal from '../components/scaling/ContainerScaleModal';
import type { RootStackParamList } from '../navigation/types';
import type { ItemUsage, Item, Ingredient, ItemType } from '@proofed/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type PlanScreenRouteProp = RouteProp<RootStackParamList, 'PlanScreen'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - spacing[4] * 2;
const CARD_MARGIN = spacing[2];
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;
const SIDE_PADDING = (screenWidth - CARD_WIDTH) / 2 - CARD_MARGIN;

interface ItemUsageInput extends ItemUsage {
  _key: string;
}

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
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<ScrollView>(null);

  // Initialize editable fields from attempt
  useEffect(() => {
    if (attempt) {
      setEditedUsages(
        attempt.itemUsages.map((u, i) => ({ ...u, _key: `existing-${i}` }))
      );
      setName(attempt.name);
      setDate(new Date(attempt.date));
    }
  }, [attempt]);

  const addItemUsage = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newKey = Date.now().toString();
    setEditedUsages([
      ...editedUsages,
      { _key: newKey, itemId: '', recipeId: '' },
    ]);
    setHasChanges(true);

    // Auto-scroll to the new item (which will be at editedUsages.length position)
    setTimeout(() => {
      carouselRef.current?.scrollTo({
        x: editedUsages.length * SNAP_INTERVAL,
        animated: true,
      });
      setActiveIndex(editedUsages.length);
    }, 100);
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
          // Navigate back to the Bakes tab, not just goBack()
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

  if (isLoading || itemsLoading) return <Loading />;
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
        <Text style={styles.headerTitle}>Planning Your Bake</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => setShowActions(true)}>
          <Icon name="more_vert" color={colors.text} size="md" />
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
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

        {/* Items Used - Carousel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items Used</Text>

          <View style={styles.carouselContainer}>
            <ScrollView
              ref={carouselRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={SNAP_INTERVAL}
              snapToAlignment="center"
              contentContainerStyle={[styles.carouselContent, { paddingHorizontal: SIDE_PADDING }]}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
                setActiveIndex(index);
              }}
            >
              {editedUsages.map((usage) => (
                <Animated.View
                  key={usage._key}
                  style={[styles.carouselCard, { width: CARD_WIDTH, marginHorizontal: CARD_MARGIN }]}
                  entering={ZoomIn.duration(300).springify().damping(15)}
                >
                  <ItemUsageRow
                    usage={usage}
                    items={items || []}
                    onUpdate={(updates) => updateItemUsage(usage._key, updates)}
                    onRemove={() => removeItemUsage(usage._key)}
                  />
                </Animated.View>
              ))}
              {/* Add button as last card */}
              <TouchableOpacity
                style={[styles.addCard, { width: CARD_WIDTH, marginHorizontal: CARD_MARGIN }]}
                onPress={addItemUsage}
              >
                <Icon name="add_circle" size="xl" color={colors.primary} />
                <Text style={styles.addCardText}>
                  {editedUsages.length === 0 ? 'Add Item' : 'Add Another Item'}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Page Indicators */}
            <View style={styles.indicators}>
              {editedUsages.map((_, index) => (
                <View
                  key={index}
                  style={[styles.indicator, activeIndex === index && styles.indicatorActive]}
                />
              ))}
              <View
                style={[
                  styles.indicator,
                  styles.indicatorAdd,
                  activeIndex === editedUsages.length && styles.indicatorActive,
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Action Area - Two Buttons */}
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
    </View>
  );
}

function ItemUsageRow({
  usage,
  items,
  onUpdate,
  onRemove,
}: {
  usage: ItemUsageInput;
  items: Item[];
  onUpdate: (updates: Partial<ItemUsageInput>) => void;
  onRemove: () => void;
}) {
  const { data: recipes } = useRecipes(usage.itemId);
  const { data: variants } = useVariants(usage.itemId, usage.recipeId);
  const { data: selectedRecipe } = useRecipe(usage.itemId, usage.recipeId);
  const { data: selectedVariantData } = useVariant(usage.itemId, usage.recipeId, usage.variantId || '');
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [showVariantPicker, setShowVariantPicker] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [editingNotes, setEditingNotes] = useState('');
  const [showScaleByIngredient, setShowScaleByIngredient] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [ingredientAmount, setIngredientAmount] = useState('');
  const [showContainerScale, setShowContainerScale] = useState(false);

  const selectedItem = items.find((i) => i.itemId === usage.itemId);
  const selectedVariant = variants?.find((v) => v.variantId === usage.variantId);
  const mergedIngredients = selectedRecipe
    ? mergeIngredients(selectedRecipe, selectedVariantData)
    : [];

  return (
    <View style={styles.usageCard}>
      <View style={styles.usageHeader}>
        <View style={styles.usageContent}>
          {/* Item Picker */}
          <View style={styles.pickerField}>
            <Text style={styles.pickerLabel}>Item</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowItemPicker(true)}
            >
              <Text
                style={[styles.pickerText, !selectedItem && styles.pickerPlaceholder]}
                numberOfLines={1}
              >
                {selectedItem?.name || 'Select item...'}
              </Text>
              <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
            </TouchableOpacity>
          </View>

          {/* Recipe Picker */}
          {usage.itemId && (
            <View style={styles.pickerField}>
              <Text style={styles.pickerLabel}>Recipe</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowRecipePicker(true)}
              >
                <Text
                  style={[styles.pickerText, !selectedRecipe && styles.pickerPlaceholder]}
                  numberOfLines={1}
                >
                  {selectedRecipe?.name || 'Select recipe...'}
                </Text>
                <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
              </TouchableOpacity>
            </View>
          )}

          {/* Variant Picker */}
          {usage.recipeId && variants && variants.length > 0 && (
            <View style={styles.pickerField}>
              <Text style={styles.pickerLabel}>Variant (optional)</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowVariantPicker(true)}
              >
                <Text
                  style={[styles.pickerText, !selectedVariant && styles.pickerPlaceholder]}
                  numberOfLines={1}
                >
                  {selectedVariant?.name || 'Base recipe'}
                </Text>
                <Icon name="expand_more" size="sm" color={colors.dustyMauve} />
              </TouchableOpacity>
            </View>
          )}

          {/* Scale Selector */}
          {usage.recipeId && (
            <View style={styles.pickerField}>
              <Text style={styles.pickerLabel}>Scale</Text>
              <View style={styles.scaleButtons}>
                {getScaleOptions(selectedRecipe?.customScales).map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.scaleButton,
                      (usage.scaleFactor ?? 1) === option.value && styles.scaleButtonActive,
                    ]}
                    onPress={() =>
                      onUpdate({ scaleFactor: option.value === 1 ? undefined : option.value })
                    }
                  >
                    <Text
                      style={[
                        styles.scaleButtonText,
                        (usage.scaleFactor ?? 1) === option.value && styles.scaleButtonTextActive,
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
                  style={styles.scaleByIngredientButton}
                  onPress={() => setShowScaleByIngredient(true)}
                >
                  <Icon name="calculate" size="sm" color={colors.primary} />
                  <Text style={styles.scaleByIngredientText}>I have...</Text>
                </TouchableOpacity>
                {/* Scale by container button - only show if recipe has container */}
                {selectedRecipe?.container && (
                  <TouchableOpacity
                    style={styles.scaleByIngredientButton}
                    onPress={() => setShowContainerScale(true)}
                  >
                    <Icon name="auto_awesome" size="sm" color={colors.primary} />
                    <Text style={styles.scaleByIngredientText}>Container</Text>
                  </TouchableOpacity>
                )}
              </View>
              {/* Show applied custom scale indicator */}
              {usage.scaleFactor && !getScaleOptions(selectedRecipe?.customScales).some(opt => opt.value === usage.scaleFactor) && (
                <View style={styles.customScaleBadge}>
                  <Icon name="check_circle" size="sm" color={colors.success} />
                  <Text style={styles.customScaleBadgeText}>
                    Custom scale applied: {formatScaleFactor(usage.scaleFactor)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Notes */}
          <View style={styles.pickerField}>
            <Text style={styles.pickerLabel}>Notes for this item</Text>
            <TouchableOpacity
              style={[styles.picker, styles.notesPreview]}
              onPress={() => {
                setEditingNotes(usage.notes || '');
                setShowNotesModal(true);
              }}
            >
              <Text
                style={[styles.pickerText, !usage.notes && styles.pickerPlaceholder]}
                numberOfLines={2}
              >
                {usage.notes || 'Tap to add notes...'}
              </Text>
              <Icon name="edit" size="sm" color={colors.dustyMauve} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <Icon name="close" color={colors.dustyMauve} size="md" />
        </TouchableOpacity>
      </View>

      {/* Item Picker Modal */}
      <Modal isOpen={showItemPicker} onClose={() => setShowItemPicker(false)} title="Select Item">
        <ScrollView style={styles.pickerList}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.itemId}
              style={styles.pickerOption}
              onPress={() => {
                onUpdate({ itemId: item.itemId, recipeId: '', variantId: undefined });
                setShowItemPicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>

      {/* Recipe Picker Modal */}
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
                onUpdate({ recipeId: recipe.recipeId, variantId: undefined });
                setShowRecipePicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>{recipe.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>

      {/* Variant Picker Modal */}
      <Modal
        isOpen={showVariantPicker}
        onClose={() => setShowVariantPicker(false)}
        title="Select Variant"
      >
        <ScrollView style={styles.pickerList}>
          <TouchableOpacity
            style={styles.pickerOption}
            onPress={() => {
              onUpdate({ variantId: undefined });
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
                onUpdate({ variantId: variant.variantId });
                setShowVariantPicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>{variant.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>

      {/* Notes Modal */}
      <Modal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        title="Notes for this item"
      >
        <TextInput
          style={styles.notesModalInput}
          value={editingNotes}
          onChangeText={setEditingNotes}
          placeholder="Add any specific notes for this item..."
          placeholderTextColor={colors.dustyMauve}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          autoFocus
        />
        <View style={styles.notesModalButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowNotesModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => {
              onUpdate({ notes: editingNotes || undefined });
              setShowNotesModal(false);
            }}
          >
            <Text style={styles.submitButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Scale by Ingredient Modal */}
      <Modal
        isOpen={showScaleByIngredient}
        onClose={() => {
          setShowScaleByIngredient(false);
          setSelectedIngredient(null);
          setIngredientAmount('');
        }}
        title="Scale by Ingredient"
      >
        {/* Step 1: Select Ingredient */}
        <Text style={styles.modalLabel}>Select ingredient</Text>
        <ScrollView style={styles.ingredientList}>
          {mergedIngredients.map((ing) => (
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

        {/* Step 2: Enter Amount (shown when ingredient selected) */}
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

            {/* Preview calculated scale */}
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

        {/* Action Buttons */}
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setShowScaleByIngredient(false);
              setSelectedIngredient(null);
              setIngredientAmount('');
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedIngredient || !ingredientAmount || parseFloat(ingredientAmount) <= 0) && styles.buttonDisabled,
            ]}
            onPress={() => {
              const scale = calculateScaleFromIngredient(
                selectedIngredient!.quantity,
                parseFloat(ingredientAmount)
              );
              onUpdate({ scaleFactor: scale === 1 ? undefined : scale });
              setShowScaleByIngredient(false);
              setSelectedIngredient(null);
              setIngredientAmount('');
            }}
            disabled={!selectedIngredient || !ingredientAmount || parseFloat(ingredientAmount) <= 0}
          >
            <Text style={styles.submitButtonText}>Apply Scale</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Scale by Container Modal */}
      {selectedRecipe?.container && (
        <ContainerScaleModal
          isOpen={showContainerScale}
          onClose={() => setShowContainerScale(false)}
          onApply={(scaleFactor) => {
            onUpdate({ scaleFactor: scaleFactor === 1 ? undefined : scaleFactor });
          }}
          sourceContainer={selectedRecipe.container}
          recipeId={selectedRecipe.recipeId}
          context={{
            itemName: selectedItem?.name || '',
            itemType: (selectedItem?.type || 'batter') as ItemType,
            recipeName: selectedRecipe.name,
            ingredients: mergedIngredients,
            bakeTime: selectedRecipe.bakeTime,
            bakeTemp: selectedRecipe.bakeTemp,
            bakeTempUnit: selectedRecipe.bakeTempUnit,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: spacing[4],
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
    flex: 1,
    marginTop: spacing[4],
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[3],
  },
  carouselContainer: {
    marginHorizontal: -spacing[4], // Extend to screen edges
  },
  carouselContent: {
    alignItems: 'flex-start',
  },
  carouselCard: {
    // Height determined by content
  },
  addCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.pastelPink,
    padding: spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    // Height determined by content - matches carouselCard
  },
  addCardText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.primary,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
    marginBottom: spacing[4],
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pastelPink,
  },
  indicatorActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  indicatorAdd: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.pastelPink,
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
  usageCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    padding: spacing[4],
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  usageContent: {
    flex: 1,
  },
  removeButton: {
    padding: spacing[2],
    marginLeft: spacing[2],
    marginTop: -spacing[2],
    marginRight: -spacing[2],
  },
  pickerField: {
    marginBottom: spacing[3],
  },
  pickerLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing[2],
  },
  picker: {
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
  pickerText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  pickerPlaceholder: {
    color: colors.dustyMauve,
  },
  notesPreview: {
    height: 60,
    alignItems: 'flex-start',
    paddingTop: spacing[3],
  },
  notesModalInput: {
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text,
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: spacing[4],
  },
  notesModalButtons: {
    flexDirection: 'row',
    gap: spacing[3],
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
  submitButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.white,
  },
  scaleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
  },
  scaleByRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[2],
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
  scaleByIngredientButton: {
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
  scaleByIngredientText: {
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
  modalLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing[2],
  },
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
  modalButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerOption: {
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
