import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Icon, Modal, Loading } from '../components/common';
import { useAttempt, useUpdateAttempt, useDeleteAttempt } from '../hooks/useAttempts';
import { useItem } from '../hooks/useItems';
import { useRecipe } from '../hooks/useRecipes';
import { useVariant } from '../hooks/useVariants';
import { mergeIngredients } from '../utils/mergeIngredients';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { ItemUsage } from '@proofed/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type BakeScreenRouteProp = RouteProp<RootStackParamList, 'BakeScreen'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function BakeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<BakeScreenRouteProp>();
  const { attemptId } = route.params;

  const { data: attempt, isLoading } = useAttempt(attemptId);
  const updateAttempt = useUpdateAttempt();
  const deleteAttempt = useDeleteAttempt();

  const [showActions, setShowActions] = useState(false);
  const [bakingStartTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  });

  // Track edited usages locally for measurement mode
  const [editedUsages, setEditedUsages] = useState<ItemUsage[]>([]);
  const hasInitialized = useRef(false);

  // Initialize from attempt
  useEffect(() => {
    if (attempt && !hasInitialized.current) {
      setEditedUsages(attempt.itemUsages);
      hasInitialized.current = true;
    }
  }, [attempt]);

  // Toggle measured ingredient
  const handleToggleMeasured = useCallback((usageIndex: number, ingredientName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditedUsages((prev) =>
      prev.map((usage, idx) => {
        if (idx !== usageIndex) return usage;
        const current = usage.measuredIngredients ?? [];
        const isMeasured = current.includes(ingredientName);
        return {
          ...usage,
          measuredIngredients: isMeasured
            ? current.filter((n) => n !== ingredientName)
            : [...current, ingredientName],
        };
      })
    );
  }, []);

  // Auto-save when usages change (debounced)
  useEffect(() => {
    if (editedUsages.length > 0 && hasInitialized.current) {
      const timer = setTimeout(() => {
        updateAttempt.mutate({ attemptId, data: { itemUsages: editedUsages } });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [editedUsages, attemptId]);

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

  const handleSessionComplete = () => {
    updateAttempt.mutate(
      { attemptId, data: { status: 'done' } },
      {
        onSuccess: () => {
          navigation.replace('EvaluateScreen', { attemptId });
        },
      }
    );
  };

  const handleCancelSession = () => {
    // Revert status to planning and go back to log screen
    updateAttempt.mutate(
      { attemptId, data: { status: 'planning' } },
      {
        onSuccess: () => {
          navigation.navigate('Tabs', { screen: 'Bakes' });
        },
      }
    );
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
        <Text style={styles.headerTitle}>Baking Session</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => setShowActions(true)}>
          <Icon name="more_vert" color={colors.text} size="md" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Status Badge */}
        <View style={styles.statusBadgeRow}>
          <View style={[styles.statusBadge, { backgroundColor: '#FFF3CD' }]}>
            <Text style={[styles.statusBadgeText, { color: '#856404' }]}>
              IN PROGRESS
            </Text>
          </View>
          <Text style={styles.stepIndicator}>Step 2/3</Text>
        </View>

        {/* Title & Time */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{attempt.name}</Text>
          <View style={styles.dateRow}>
            <Icon name="schedule" size="sm" color={colors.dustyMauve} />
            <Text style={styles.date}>STARTED {bakingStartTime}</Text>
          </View>
        </View>

        {/* Ingredients Checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INGREDIENTS CHECKLIST</Text>
          {editedUsages.length > 0 ? (
            editedUsages.map((usage, index) => (
              <BakingChecklist
                key={index}
                usage={usage}
                onToggleIngredient={(ingredientName) =>
                  handleToggleMeasured(index, ingredientName)
                }
                onNavigateToTimer={(itemName, bakeTimeMinutes, bakeTemp, bakeTempUnit) => {
                  navigation.navigate('TimerScreen', {
                    itemName,
                    bakeTimeMinutes,
                    bakeTemp,
                    bakeTempUnit,
                  });
                }}
              />
            ))
          ) : (
            <View style={styles.card}>
              <Text style={styles.emptyText}>No items recorded</Text>
            </View>
          )}
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

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomAction, { paddingBottom: insets.bottom + spacing[4] }]}>
        <TouchableOpacity
          style={styles.bakingButton}
          onPress={handleSessionComplete}
          disabled={updateAttempt.isPending}
        >
          <Icon name="check" color={colors.white} size="md" />
          <Text style={styles.bakingButtonText}>Session Complete</Text>
        </TouchableOpacity>
      </View>

      {/* Action Sheet */}
      <Modal isOpen={showActions} onClose={() => setShowActions(false)} title="Actions">
        <TouchableOpacity
          style={styles.actionOption}
          onPress={() => {
            setShowActions(false);
            handleCancelSession();
          }}
        >
          <Icon name="close" color={colors.text} size="md" />
          <Text style={styles.actionOptionText}>Cancel Session</Text>
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
    </View>
  );
}

function BakingChecklist({
  usage,
  onToggleIngredient,
  onNavigateToTimer,
}: {
  usage: ItemUsage;
  onToggleIngredient: (ingredientName: string) => void;
  onNavigateToTimer: (itemName: string, bakeTime: number, bakeTemp?: number, bakeTempUnit?: 'F' | 'C') => void;
}) {
  const [notesExpanded, setNotesExpanded] = useState(false);
  const swipeableRef = useRef<Swipeable>(null);
  const { data: item } = useItem(usage.itemId);
  const { data: recipe } = useRecipe(usage.itemId, usage.recipeId);
  const { data: variant } = useVariant(usage.itemId, usage.recipeId, usage.variantId || '');

  const scaleFactor = usage.scaleFactor ?? 1;
  const measurementEnabled = usage.measurementEnabled ?? false;
  const measuredIngredients = usage.measuredIngredients ?? [];

  // Get bake temp/time from variant (if set) or recipe
  const bakeTemp = variant?.bakeTemp ?? recipe?.bakeTemp;
  const bakeTime = variant?.bakeTime ?? recipe?.bakeTime;
  const bakeTempUnit = variant?.bakeTempUnit ?? recipe?.bakeTempUnit ?? 'C';

  if (!recipe) {
    return (
      <View style={styles.checklistCard}>
        <Text style={styles.emptyText}>Loading...</Text>
      </View>
    );
  }

  const ingredients = mergeIngredients(recipe, variant);

  const handleTimerPress = () => {
    swipeableRef.current?.close();
    if (bakeTime && item) {
      onNavigateToTimer(item.name, bakeTime, bakeTemp, bakeTempUnit);
    }
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (!bakeTime) return null;

    const translateX = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.timerActionContainer}>
        <Animated.View style={[styles.timerAction, { transform: [{ translateX }] }]}>
          <TouchableOpacity style={styles.timerButton} onPress={handleTimerPress}>
            <Icon name="timer" color={colors.white} size="md" />
            <Text style={styles.timerButtonText}>Timer</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const cardContent = (
    <View style={styles.checklistCard}>
      {/* Header with icon */}
      <View style={styles.checklistHeader}>
        <View style={styles.checklistIconRow}>
          <View style={styles.checklistIcon}>
            <Icon name="cake" size="sm" color={colors.primary} />
          </View>
          <View style={styles.checklistTitleContent}>
            <Text style={styles.checklistTitle}>{item?.name || 'Loading...'}</Text>
            <Text style={scaleFactor !== 1 ? styles.scaledLabel : styles.standardBatchLabel}>
              {scaleFactor !== 1 ? `Scaled ×${scaleFactor}` : 'STANDARD BATCH'}
            </Text>
            {/* Bake temp and time */}
            {(bakeTemp || bakeTime) && (
              <View style={styles.bakeInfoRow}>
                {bakeTemp && (
                  <View style={styles.bakeInfoItem}>
                    <Icon name="thermostat" size="sm" color={colors.dustyMauve} />
                    <Text style={styles.bakeInfoText}>
                      {bakeTemp}°{bakeTempUnit}
                    </Text>
                  </View>
                )}
                {bakeTime && (
                  <View style={styles.bakeInfoItem}>
                    <Icon name="timer" size="sm" color={colors.dustyMauve} />
                    <Text style={styles.bakeInfoText}>{bakeTime} min</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Ingredients list */}
      <View style={styles.ingredientsList}>
        {ingredients.map((ing) => {
          const scaledQuantity = Math.round(ing.quantity * scaleFactor * 100) / 100;
          const isMeasured = measuredIngredients.includes(ing.name);

          if (measurementEnabled) {
            return (
              <TouchableOpacity
                key={ing.name}
                style={styles.ingredientRowCheckable}
                onPress={() => onToggleIngredient(ing.name)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, isMeasured && styles.checkboxChecked]}>
                  {isMeasured && (
                    <Icon name="check" size="sm" color={colors.white} />
                  )}
                </View>
                <Text
                  style={[
                    styles.ingredientName,
                    isMeasured && styles.ingredientNameMeasured,
                  ]}
                >
                  {ing.name}
                </Text>
                <Text
                  style={[
                    styles.ingredientQuantity,
                    isMeasured && styles.ingredientQuantityMeasured,
                  ]}
                >
                  {scaledQuantity}{ing.unit}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <View key={ing.name} style={styles.ingredientRow}>
              <Text style={styles.ingredientName}>{ing.name}</Text>
              <Text style={styles.ingredientQuantity}>
                {scaledQuantity}{ing.unit}
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

  // Wrap with Swipeable if bakeTime exists
  if (bakeTime) {
    return (
      <View style={styles.swipeableWrapper}>
        <Swipeable
          ref={swipeableRef}
          renderRightActions={renderRightActions}
          rightThreshold={40}
          overshootRight={false}
        >
          {cardContent}
        </Swipeable>
      </View>
    );
  }

  return cardContent;
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
  stepIndicator: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
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
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[3],
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
  checklistCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  checklistHeader: {
    marginBottom: spacing[3],
  },
  checklistIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checklistIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  checklistTitleContent: {
    flex: 1,
  },
  checklistTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
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
  ingredientNameMeasured: {
    textDecorationLine: 'line-through',
    color: colors.dustyMauve,
  },
  ingredientQuantity: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  ingredientQuantityMeasured: {
    textDecorationLine: 'line-through',
  },
  bakeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[1],
  },
  bakeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  bakeInfoText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
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
  bakingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: '#856404',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
  },
  bakingButtonText: {
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
  swipeableWrapper: {
    overflow: 'hidden',
    borderRadius: borderRadius.xl,
  },
  timerActionContainer: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  timerAction: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerButton: {
    width: 72,
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing[2],
  },
  timerButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.white,
    marginTop: spacing[1],
  },
});
