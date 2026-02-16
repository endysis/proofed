import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type TimerState = 'idle' | 'running' | 'paused' | 'finished';

interface ActiveTimer {
  itemName: string;
  totalSeconds: number;
  bakeTemp?: number;
  bakeTempUnit?: 'F' | 'C';
  reminderMinutes?: number; // Minutes before completion to send reminder
}

interface TimerContextType {
  // Current timer info
  activeTimer: ActiveTimer | null;
  timerState: TimerState;
  remainingSeconds: number;

  // Actions
  startTimer: (timer: ActiveTimer) => void;
  resumeTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  clearTimer: () => void;
  setReminder: (minutes: number) => void;
  clearReminder: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedBeforePauseRef = useRef<number>(0);
  const notificationIdRef = useRef<string | null>(null);
  const reminderNotificationIdRef = useRef<string | null>(null);

  // Request notification permissions on mount
  useEffect(() => {
    async function requestPermissions() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
      }
    }
    requestPermissions();
  }, []);

  const clearIntervalTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const cancelScheduledNotification = useCallback(async () => {
    if (notificationIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
      notificationIdRef.current = null;
    }
  }, []);

  const cancelReminderNotification = useCallback(async () => {
    if (reminderNotificationIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(reminderNotificationIdRef.current);
      reminderNotificationIdRef.current = null;
    }
  }, []);

  const scheduleReminderNotification = useCallback(async (itemName: string, secondsUntilReminder: number) => {
    await cancelReminderNotification();

    if (secondsUntilReminder <= 0) return;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Timer Reminder ⏰',
        body: `${itemName} will be ready soon! Time to check.`,
        sound: true,
      },
      trigger: {
        seconds: secondsUntilReminder,
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      },
    });

    reminderNotificationIdRef.current = id;
  }, [cancelReminderNotification]);

  const scheduleCompletionNotification = useCallback(async (itemName: string, seconds: number) => {
    // Cancel any existing notification first
    await cancelScheduledNotification();

    // Schedule new notification
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Timer Complete! 🎂',
        body: `${itemName} is ready to check.`,
        sound: true,
      },
      trigger: {
        seconds,
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      },
    });

    notificationIdRef.current = id;
  }, [cancelScheduledNotification]);

  const handleFinished = useCallback((itemName: string) => {
    clearIntervalTimer();
    setTimerState('finished');
    setRemainingSeconds(0);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Show alert when app is in foreground
    Alert.alert(
      'Timer Complete!',
      `${itemName} is ready to check.`,
      [{ text: 'OK', style: 'default' }]
    );
  }, [clearIntervalTimer]);

  const startTimer = useCallback(async (timer: ActiveTimer) => {
    clearIntervalTimer();

    setActiveTimer(timer);
    setRemainingSeconds(timer.totalSeconds);
    elapsedBeforePauseRef.current = 0;
    startTimeRef.current = Date.now();

    // Schedule push notification for when timer completes
    await scheduleCompletionNotification(timer.itemName, timer.totalSeconds);

    intervalRef.current = setInterval(() => {
      const elapsedMs = Date.now() - startTimeRef.current;
      const elapsedSecs = Math.floor(elapsedMs / 1000);
      const remaining = Math.max(0, timer.totalSeconds - elapsedSecs);

      setRemainingSeconds(remaining);

      if (remaining === 0) {
        handleFinished(timer.itemName);
      }
    }, 100);

    setTimerState('running');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [clearIntervalTimer, handleFinished, scheduleCompletionNotification]);

  const resumeTimer = useCallback(async () => {
    if (!activeTimer || timerState !== 'paused') return;

    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current * 1000;

    // Schedule notification for remaining time
    const remaining = activeTimer.totalSeconds - elapsedBeforePauseRef.current;
    if (remaining > 0) {
      await scheduleCompletionNotification(activeTimer.itemName, remaining);
    }

    intervalRef.current = setInterval(() => {
      const elapsedMs = Date.now() - startTimeRef.current;
      const elapsedSecs = Math.floor(elapsedMs / 1000);
      const remaining = Math.max(0, activeTimer.totalSeconds - elapsedSecs);

      setRemainingSeconds(remaining);

      if (remaining === 0) {
        handleFinished(activeTimer.itemName);
      }
    }, 100);

    setTimerState('running');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [activeTimer, timerState, handleFinished, scheduleCompletionNotification]);

  const pauseTimer = useCallback(async () => {
    if (!activeTimer) return;

    clearIntervalTimer();
    await cancelScheduledNotification();
    await cancelReminderNotification();
    elapsedBeforePauseRef.current = activeTimer.totalSeconds - remainingSeconds;
    setTimerState('paused');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [activeTimer, remainingSeconds, clearIntervalTimer, cancelScheduledNotification, cancelReminderNotification]);

  const resetTimer = useCallback(async () => {
    if (!activeTimer) return;

    clearIntervalTimer();
    await cancelScheduledNotification();
    await cancelReminderNotification();
    setRemainingSeconds(activeTimer.totalSeconds);
    setActiveTimer({ ...activeTimer, reminderMinutes: undefined });
    elapsedBeforePauseRef.current = 0;
    setTimerState('idle');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [activeTimer, clearIntervalTimer, cancelScheduledNotification, cancelReminderNotification]);

  const clearTimer = useCallback(async () => {
    clearIntervalTimer();
    await cancelScheduledNotification();
    await cancelReminderNotification();
    setActiveTimer(null);
    setTimerState('idle');
    setRemainingSeconds(0);
    elapsedBeforePauseRef.current = 0;
  }, [clearIntervalTimer, cancelScheduledNotification, cancelReminderNotification]);

  const setReminder = useCallback(async (minutes: number) => {
    if (!activeTimer || timerState !== 'running') return;

    // Calculate seconds until reminder (remaining - reminder minutes)
    const reminderSeconds = minutes * 60;
    const secondsUntilReminder = remainingSeconds - reminderSeconds;

    if (secondsUntilReminder > 0) {
      await scheduleReminderNotification(activeTimer.itemName, secondsUntilReminder);
      setActiveTimer({ ...activeTimer, reminderMinutes: minutes });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [activeTimer, timerState, remainingSeconds, scheduleReminderNotification]);

  const clearReminder = useCallback(async () => {
    await cancelReminderNotification();
    if (activeTimer) {
      setActiveTimer({ ...activeTimer, reminderMinutes: undefined });
    }
  }, [activeTimer, cancelReminderNotification]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearIntervalTimer();
      // Don't cancel notification on unmount - we want it to fire even if app closes
    };
  }, [clearIntervalTimer]);

  return (
    <TimerContext.Provider
      value={{
        activeTimer,
        timerState,
        remainingSeconds,
        startTimer,
        resumeTimer,
        pauseTimer,
        resetTimer,
        clearTimer,
        setReminder,
        clearReminder,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
