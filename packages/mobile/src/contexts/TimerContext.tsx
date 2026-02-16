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
  halfwayNotification?: boolean; // Notify at halfway point
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
  addMinute: () => void;
  setReminder: (minutes: number) => void;
  clearReminder: () => void;
  setHalfwayNotification: () => void;
  clearHalfwayNotification: () => void;
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
  const halfwayNotificationIdRef = useRef<string | null>(null);

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

  const cancelHalfwayNotification = useCallback(async () => {
    if (halfwayNotificationIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(halfwayNotificationIdRef.current);
      halfwayNotificationIdRef.current = null;
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

  const scheduleHalfwayNotification = useCallback(async (itemName: string, secondsUntilHalfway: number) => {
    await cancelHalfwayNotification();

    if (secondsUntilHalfway <= 0) return;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Halfway There! ⏱️',
        body: `${itemName} is at the halfway point.`,
        sound: true,
      },
      trigger: {
        seconds: secondsUntilHalfway,
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      },
    });

    halfwayNotificationIdRef.current = id;
  }, [cancelHalfwayNotification]);

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

      // Reschedule reminder notification if one was set
      if (activeTimer.reminderMinutes) {
        const reminderSeconds = activeTimer.reminderMinutes * 60;
        const secondsUntilReminder = remaining - reminderSeconds;
        if (secondsUntilReminder > 0) {
          await scheduleReminderNotification(activeTimer.itemName, secondsUntilReminder);
        }
      }

      // Reschedule halfway notification if one was set
      if (activeTimer.halfwayNotification) {
        const halfwayPoint = activeTimer.totalSeconds / 2;
        const secondsUntilHalfway = remaining - (activeTimer.totalSeconds - halfwayPoint);
        if (secondsUntilHalfway > 0) {
          await scheduleHalfwayNotification(activeTimer.itemName, secondsUntilHalfway);
        }
      }
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
  }, [activeTimer, timerState, handleFinished, scheduleCompletionNotification, scheduleReminderNotification, scheduleHalfwayNotification]);

  const pauseTimer = useCallback(async () => {
    if (!activeTimer) return;

    clearIntervalTimer();
    await cancelScheduledNotification();
    await cancelReminderNotification();
    await cancelHalfwayNotification();
    elapsedBeforePauseRef.current = activeTimer.totalSeconds - remainingSeconds;
    setTimerState('paused');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [activeTimer, remainingSeconds, clearIntervalTimer, cancelScheduledNotification, cancelReminderNotification, cancelHalfwayNotification]);

  const resetTimer = useCallback(async () => {
    if (!activeTimer) return;

    clearIntervalTimer();
    await cancelScheduledNotification();
    await cancelReminderNotification();
    await cancelHalfwayNotification();
    setRemainingSeconds(activeTimer.totalSeconds);
    setActiveTimer({ ...activeTimer, reminderMinutes: undefined, halfwayNotification: undefined });
    elapsedBeforePauseRef.current = 0;
    setTimerState('idle');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [activeTimer, clearIntervalTimer, cancelScheduledNotification, cancelReminderNotification, cancelHalfwayNotification]);

  const clearTimer = useCallback(async () => {
    clearIntervalTimer();
    await cancelScheduledNotification();
    await cancelReminderNotification();
    await cancelHalfwayNotification();
    setActiveTimer(null);
    setTimerState('idle');
    setRemainingSeconds(0);
    elapsedBeforePauseRef.current = 0;
  }, [clearIntervalTimer, cancelScheduledNotification, cancelReminderNotification, cancelHalfwayNotification]);

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

  const setHalfwayNotification = useCallback(async () => {
    if (!activeTimer || timerState !== 'running') return;

    // Calculate seconds until halfway point
    const halfwayPoint = activeTimer.totalSeconds / 2;
    const secondsUntilHalfway = remainingSeconds - (activeTimer.totalSeconds - halfwayPoint);

    if (secondsUntilHalfway > 0) {
      await scheduleHalfwayNotification(activeTimer.itemName, secondsUntilHalfway);
      setActiveTimer({ ...activeTimer, halfwayNotification: true });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [activeTimer, timerState, remainingSeconds, scheduleHalfwayNotification]);

  const clearHalfwayNotification = useCallback(async () => {
    await cancelHalfwayNotification();
    if (activeTimer) {
      setActiveTimer({ ...activeTimer, halfwayNotification: undefined });
    }
  }, [activeTimer, cancelHalfwayNotification]);

  const addMinute = useCallback(async () => {
    if (!activeTimer) return;

    const newTotalSeconds = activeTimer.totalSeconds + 60;
    const newRemaining = remainingSeconds + 60;

    if (timerState === 'finished') {
      // Restart timer with 1 minute
      setActiveTimer({ ...activeTimer, totalSeconds: newTotalSeconds });
      setRemainingSeconds(60);
      elapsedBeforePauseRef.current = newTotalSeconds - 60;
      startTimeRef.current = Date.now() - elapsedBeforePauseRef.current * 1000;

      await scheduleCompletionNotification(activeTimer.itemName, 60);

      // Start interval
      const updatedTotalSeconds = newTotalSeconds;
      intervalRef.current = setInterval(() => {
        const elapsedMs = Date.now() - startTimeRef.current;
        const elapsedSecs = Math.floor(elapsedMs / 1000);
        const remaining = Math.max(0, updatedTotalSeconds - elapsedSecs);

        setRemainingSeconds(remaining);

        if (remaining === 0) {
          handleFinished(activeTimer.itemName);
        }
      }, 100);

      setTimerState('running');
    } else if (timerState === 'running') {
      // Add to running timer - must recreate interval with new totalSeconds
      clearIntervalTimer();

      setActiveTimer({ ...activeTimer, totalSeconds: newTotalSeconds });
      setRemainingSeconds(newRemaining);

      // Adjust timing refs for new total
      elapsedBeforePauseRef.current = newTotalSeconds - newRemaining;
      startTimeRef.current = Date.now() - elapsedBeforePauseRef.current * 1000;

      // Reschedule completion notification
      await scheduleCompletionNotification(activeTimer.itemName, newRemaining);

      // Restart interval with updated total (captured in closure)
      const updatedTotalSeconds = newTotalSeconds;
      intervalRef.current = setInterval(() => {
        const elapsedMs = Date.now() - startTimeRef.current;
        const elapsedSecs = Math.floor(elapsedMs / 1000);
        const remaining = Math.max(0, updatedTotalSeconds - elapsedSecs);

        setRemainingSeconds(remaining);

        if (remaining === 0) {
          handleFinished(activeTimer.itemName);
        }
      }, 100);
    } else if (timerState === 'paused') {
      // Add to paused timer (no notification needed yet)
      setActiveTimer({ ...activeTimer, totalSeconds: newTotalSeconds });
      setRemainingSeconds(newRemaining);
      elapsedBeforePauseRef.current = newTotalSeconds - newRemaining;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [activeTimer, remainingSeconds, timerState, clearIntervalTimer, scheduleCompletionNotification, handleFinished]);

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
        addMinute,
        setReminder,
        clearReminder,
        setHalfwayNotification,
        clearHalfwayNotification,
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
