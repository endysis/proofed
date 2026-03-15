import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AppState,
  AppStateStatus,
} from 'react-native';
import Modal from './Modal';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../../theme';

interface StopwatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StopwatchModal({ isOpen, onClose }: StopwatchModalProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedElapsedRef = useRef<number>(0);

  // Format time as MM:SS.d
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const deciseconds = Math.floor((ms % 1000) / 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${deciseconds}`;
  };

  const startStopwatch = useCallback(() => {
    if (intervalRef.current) return;

    startTimeRef.current = Date.now() - pausedElapsedRef.current;
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current !== null) {
        setElapsedMs(Date.now() - startTimeRef.current);
      }
    }, 100);
  }, []);

  const pauseStopwatch = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    pausedElapsedRef.current = elapsedMs;
    setIsRunning(false);
  }, [elapsedMs]);

  const resetStopwatch = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    startTimeRef.current = null;
    pausedElapsedRef.current = 0;
    setElapsedMs(0);
    setIsRunning(false);
  }, []);

  // Handle app state changes for background/foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isRunning && startTimeRef.current !== null) {
        // App came back to foreground, recalculate elapsed time
        setElapsedMs(Date.now() - startTimeRef.current);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isRunning]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stopwatch">
      <View style={styles.container}>
        {/* Time Display */}
        <View style={styles.timeContainer}>
          <Text style={styles.timeDisplay}>{formatTime(elapsedMs)}</Text>
          <Text style={styles.timeLabel}>elapsed</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.resetButton]}
            onPress={resetStopwatch}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.primaryButton]}
            onPress={isRunning ? pauseStopwatch : startStopwatch}
          >
            <Text style={styles.primaryButtonText}>
              {isRunning ? 'Pause' : 'Start'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  timeDisplay: {
    fontFamily: fontFamily.bold,
    fontSize: 56,
    color: colors.text,
    letterSpacing: 2,
  },
  timeLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    marginTop: spacing[1],
  },
  controls: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  controlButton: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    borderRadius: borderRadius.xl,
    minWidth: 100,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  resetButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.text,
  },
  primaryButton: {
    backgroundColor: colors.info,
  },
  primaryButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.white,
  },
});
