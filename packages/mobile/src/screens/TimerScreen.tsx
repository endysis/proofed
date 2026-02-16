import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Icon, Modal } from '../components/common';
import { useTimer } from '../contexts/TimerContext';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type TimerScreenRouteProp = RouteProp<RootStackParamList, 'TimerScreen'>;

const CIRCLE_SIZE = 280;
const STROKE_WIDTH = 12;

// Reminder options in minutes
const REMINDER_OPTIONS = [1, 2, 3, 5, 10];

export default function TimerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<TimerScreenRouteProp>();
  const { itemName, bakeTimeMinutes, bakeTemp, bakeTempUnit = 'C' } = route.params;

  const [showReminderModal, setShowReminderModal] = useState(false);

  const {
    activeTimer,
    timerState,
    remainingSeconds,
    startTimer,
    resumeTimer,
    pauseTimer,
    resetTimer,
    setReminder,
    clearReminder,
  } = useTimer();

  const totalSeconds = bakeTimeMinutes * 60;

  // Use context values if timer is for this item, otherwise use route params
  const isActiveForThisItem = activeTimer?.itemName === itemName;
  const displaySeconds = isActiveForThisItem ? remainingSeconds : totalSeconds;
  const displayState = isActiveForThisItem ? timerState : 'idle';
  const displayTemp = isActiveForThisItem ? activeTimer?.bakeTemp : bakeTemp;
  const displayTempUnit = isActiveForThisItem ? (activeTimer?.bakeTempUnit ?? 'C') : bakeTempUnit;
  const reminderMinutes = isActiveForThisItem ? activeTimer?.reminderMinutes : undefined;

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress (0 to 1)
  const progress = isActiveForThisItem
    ? 1 - remainingSeconds / (activeTimer?.totalSeconds ?? totalSeconds)
    : 0;

  const isRunning = displayState === 'running';
  const isPaused = displayState === 'paused';
  const isFinished = displayState === 'finished';
  const canReset = displayState !== 'idle';
  const canSetReminder = isRunning && displaySeconds > 60; // At least 1 min remaining

  const handleStartOrResume = () => {
    if (displayState === 'idle' || !isActiveForThisItem) {
      startTimer({
        itemName,
        totalSeconds,
        bakeTemp,
        bakeTempUnit,
      });
    } else if (displayState === 'paused') {
      resumeTimer();
    }
  };

  const handlePause = () => {
    pauseTimer();
  };

  const handleReset = () => {
    resetTimer();
  };

  const handleSetReminder = (minutes: number) => {
    setReminder(minutes);
    setShowReminderModal(false);
  };

  const handleClearReminder = () => {
    clearReminder();
    setShowReminderModal(false);
  };

  // Filter reminder options to only show those less than remaining time
  const availableReminderOptions = REMINDER_OPTIONS.filter(
    (mins) => mins * 60 < displaySeconds
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow_back_ios" color={colors.text} size="md" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {itemName}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Timer Content */}
      <View style={styles.content}>
        {/* Temperature Badge */}
        {displayTemp && (
          <View style={styles.tempBadge}>
            <Icon name="thermostat" size="md" color={colors.primary} />
            <Text style={styles.tempText}>
              {displayTemp}°{displayTempUnit}
            </Text>
          </View>
        )}

        {/* Timer Display with Progress Ring */}
        <View style={styles.timerContainer}>
          {/* Background ring */}
          <View style={styles.progressRingBackground} />

          {/* Progress indicator using border */}
          <View
            style={[
              styles.progressRingFill,
              {
                borderColor: isFinished ? colors.success : colors.primary,
                borderTopColor: progress > 0.25 ? (isFinished ? colors.success : colors.primary) : 'transparent',
                borderRightColor: progress > 0.5 ? (isFinished ? colors.success : colors.primary) : 'transparent',
                borderBottomColor: progress > 0.75 ? (isFinished ? colors.success : colors.primary) : 'transparent',
                borderLeftColor: progress > 0 ? (isFinished ? colors.success : colors.primary) : 'transparent',
                transform: [{ rotate: `${progress * 360}deg` }],
              }
            ]}
          />

          {/* Inner circle with time display */}
          <View style={styles.innerCircle}>
            <Text style={[styles.timeDisplay, isFinished && styles.timeDisplayFinished]}>
              {formatTime(displaySeconds)}
            </Text>
            {isFinished && (
              <Text style={styles.finishedLabel}>DONE!</Text>
            )}
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: isFinished ? colors.success : colors.primary,
                }
              ]}
            />
          </View>
        </View>

        {/* Reminder Badge */}
        {reminderMinutes && (
          <View style={styles.reminderBadge}>
            <Icon name="notifications_active" size="sm" color={colors.warning} />
            <Text style={styles.reminderBadgeText}>
              Reminder set: {reminderMinutes} min before
            </Text>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.resetButton, !canReset && styles.controlButtonDisabled]}
            onPress={handleReset}
            disabled={!canReset}
          >
            <Icon name="replay" size="md" color={canReset ? colors.text : colors.dustyMauve} />
            <Text style={[styles.controlButtonText, !canReset && styles.controlButtonTextDisabled]}>
              Reset
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.primaryButton, isFinished && styles.primaryButtonFinished]}
            onPress={isRunning ? handlePause : handleStartOrResume}
            disabled={isFinished}
          >
            <Icon
              name={isRunning ? 'pause' : 'play_arrow'}
              size="lg"
              color={colors.white}
            />
            <Text style={styles.primaryButtonText}>
              {isRunning ? 'Pause' : isFinished ? 'Done' : 'Start'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reminder Button */}
        {(isRunning || isPaused) && !isFinished && (
          <TouchableOpacity
            style={[styles.reminderButton, !canSetReminder && styles.reminderButtonDisabled]}
            onPress={() => setShowReminderModal(true)}
            disabled={!canSetReminder}
          >
            <Icon
              name={reminderMinutes ? 'notifications_active' : 'add_alert'}
              size="sm"
              color={canSetReminder ? colors.warning : colors.dustyMauve}
            />
            <Text style={[styles.reminderButtonText, !canSetReminder && styles.reminderButtonTextDisabled]}>
              {reminderMinutes ? 'Change Reminder' : 'Set Reminder'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Reminder Modal */}
      <Modal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        title="Set Reminder"
      >
        <Text style={styles.modalSubtitle}>
          Get notified before the timer ends
        </Text>

        <View style={styles.reminderOptions}>
          {availableReminderOptions.map((mins) => (
            <TouchableOpacity
              key={mins}
              style={[
                styles.reminderOption,
                reminderMinutes === mins && styles.reminderOptionActive,
              ]}
              onPress={() => handleSetReminder(mins)}
            >
              <Text
                style={[
                  styles.reminderOptionText,
                  reminderMinutes === mins && styles.reminderOptionTextActive,
                ]}
              >
                {mins} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {availableReminderOptions.length === 0 && (
          <Text style={styles.noOptionsText}>
            Not enough time remaining for a reminder
          </Text>
        )}

        {reminderMinutes && (
          <TouchableOpacity style={styles.clearReminderButton} onPress={handleClearReminder}>
            <Icon name="notifications_off" size="sm" color={colors.primary} />
            <Text style={styles.clearReminderButtonText}>Clear Reminder</Text>
          </TouchableOpacity>
        )}
      </Modal>
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
    marginHorizontal: spacing[2],
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
  },
  tempBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    marginBottom: spacing[8],
  },
  tempText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.primary,
  },
  timerContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  progressRingBackground: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: STROKE_WIDTH,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  progressRingFill: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: STROKE_WIDTH,
    borderColor: 'transparent',
  },
  innerCircle: {
    width: CIRCLE_SIZE - STROKE_WIDTH * 2,
    height: CIRCLE_SIZE - STROKE_WIDTH * 2,
    borderRadius: (CIRCLE_SIZE - STROKE_WIDTH * 2) / 2,
    backgroundColor: colors.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDisplay: {
    fontFamily: fontFamily.bold,
    fontSize: 64,
    color: colors.text,
    letterSpacing: 2,
  },
  timeDisplayFinished: {
    color: colors.success,
  },
  finishedLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.success,
    marginTop: spacing[2],
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: spacing[4],
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
  },
  reminderBadgeText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.warning,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.xl,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  resetButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  controlButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    marginTop: spacing[1],
  },
  controlButtonTextDisabled: {
    color: colors.dustyMauve,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[8],
  },
  primaryButtonFinished: {
    backgroundColor: colors.success,
  },
  primaryButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.white,
    marginTop: spacing[1],
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[6],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.warning,
    borderStyle: 'dashed',
  },
  reminderButtonDisabled: {
    borderColor: colors.dustyMauve,
    opacity: 0.5,
  },
  reminderButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.warning,
  },
  reminderButtonTextDisabled: {
    color: colors.dustyMauve,
  },
  modalSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    marginBottom: spacing[4],
  },
  reminderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  reminderOption: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reminderOptionActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: colors.warning,
  },
  reminderOptionText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
  },
  reminderOptionTextActive: {
    color: colors.warning,
  },
  noOptionsText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  clearReminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  clearReminderButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
});
