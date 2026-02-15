import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Icon } from '../components/common';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type TimerScreenRouteProp = RouteProp<RootStackParamList, 'TimerScreen'>;
type TimerState = 'idle' | 'running' | 'paused' | 'finished';

const CIRCLE_SIZE = 280;
const STROKE_WIDTH = 12;

export default function TimerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<TimerScreenRouteProp>();
  const { itemName, bakeTimeMinutes, bakeTemp, bakeTempUnit = 'C' } = route.params;

  const totalSeconds = bakeTimeMinutes * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [timerState, setTimerState] = useState<TimerState>('idle');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleFinished = useCallback(() => {
    clearTimer();
    setTimerState('finished');
    setRemainingSeconds(0);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      'Timer Complete!',
      `${itemName} is ready to check.`,
      [{ text: 'OK', style: 'default' }]
    );
  }, [clearTimer, itemName]);

  const startTimer = useCallback(() => {
    const elapsedBeforePause = totalSeconds - remainingSeconds;
    startTimeRef.current = Date.now() - elapsedBeforePause * 1000;

    intervalRef.current = setInterval(() => {
      const elapsedMs = Date.now() - startTimeRef.current;
      const elapsedSecs = Math.floor(elapsedMs / 1000);
      const remaining = Math.max(0, totalSeconds - elapsedSecs);

      setRemainingSeconds(remaining);

      if (remaining === 0) {
        handleFinished();
      }
    }, 100);

    setTimerState('running');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [totalSeconds, remainingSeconds, handleFinished]);

  const pauseTimer = useCallback(() => {
    clearTimer();
    setTimerState('paused');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [clearTimer]);

  const resetTimer = useCallback(() => {
    clearTimer();
    setRemainingSeconds(totalSeconds);
    setTimerState('idle');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [clearTimer, totalSeconds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress (0 to 1)
  const progress = 1 - remainingSeconds / totalSeconds;

  const isRunning = timerState === 'running';
  const isFinished = timerState === 'finished';
  const canReset = timerState !== 'idle' || remainingSeconds !== totalSeconds;

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
        {bakeTemp && (
          <View style={styles.tempBadge}>
            <Icon name="thermostat" size="md" color={colors.primary} />
            <Text style={styles.tempText}>
              {bakeTemp}°{bakeTempUnit}
            </Text>
          </View>
        )}

        {/* Timer Display with Progress Ring */}
        <View style={styles.timerContainer}>
          {/* Background ring */}
          <View style={styles.progressRingBackground} />

          {/* Progress ring - using a simplified visual indicator */}
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

          {/* Inner white circle to create ring effect */}
          <View style={styles.innerCircle}>
            {/* Time Display */}
            <Text style={[styles.timeDisplay, isFinished && styles.timeDisplayFinished]}>
              {formatTime(remainingSeconds)}
            </Text>
            {isFinished && (
              <Text style={styles.finishedLabel}>DONE!</Text>
            )}
          </View>
        </View>

        {/* Progress bar as alternative visual */}
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

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.resetButton, !canReset && styles.controlButtonDisabled]}
            onPress={resetTimer}
            disabled={!canReset}
          >
            <Icon name="replay" size="md" color={canReset ? colors.text : colors.dustyMauve} />
            <Text style={[styles.controlButtonText, !canReset && styles.controlButtonTextDisabled]}>
              Reset
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.primaryButton, isFinished && styles.primaryButtonFinished]}
            onPress={isRunning ? pauseTimer : startTimer}
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
      </View>
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
    marginBottom: spacing[8],
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
});
