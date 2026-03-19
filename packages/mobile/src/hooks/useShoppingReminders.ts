import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAttempts } from './useAttempts';
import { usePreferences } from '../contexts/PreferencesContext';
import type { Attempt } from '@proofed/shared';

const STORAGE_KEY = '@proofed/shopping_reminders';

interface TrackedReminder {
  notificationId: string;
  scheduledFor: string; // ISO date string of the reminder fire date
}

type ReminderMap = Record<string, TrackedReminder>;

async function loadTracked(): Promise<ReminderMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveTracked(map: ReminderMap): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function hasShoppingListEnabled(attempt: Attempt): boolean {
  return attempt.itemUsages?.some(u => u.shoppingListEnabled === true) ?? false;
}

function qualifies(attempt: Attempt): boolean {
  const status = attempt.status ?? 'planning';
  return (status === 'planning' || status === 'baking') && hasShoppingListEnabled(attempt);
}

function computeReminderDate(bakeDate: string, daysBefore: number): Date {
  const d = new Date(bakeDate);
  d.setDate(d.getDate() - daysBefore);
  d.setHours(9, 0, 0, 0); // Fire at 9 AM local time
  return d;
}

export function useShoppingReminders() {
  const { data: attemptsData } = useAttempts();
  const { shoppingReminderEnabled, shoppingReminderDaysBefore } = usePreferences();
  const isReconciling = useRef(false);

  useEffect(() => {
    if (isReconciling.current) return;

    const reconcile = async () => {
      isReconciling.current = true;
      try {
        const tracked = await loadTracked();
        const now = new Date();

        // If reminders disabled globally, cancel everything
        if (!shoppingReminderEnabled) {
          for (const [attemptId, reminder] of Object.entries(tracked)) {
            try {
              await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
            } catch {
              // Already cancelled or expired
            }
            delete tracked[attemptId];
          }
          await saveTracked(tracked);
          return;
        }

        const attempts: Attempt[] = attemptsData ?? [];
        const qualifyingIds = new Set<string>();

        // Schedule or reschedule for qualifying attempts
        for (const attempt of attempts) {
          if (!qualifies(attempt)) continue;

          const reminderDate = computeReminderDate(attempt.date, shoppingReminderDaysBefore);
          if (reminderDate <= now) continue; // Skip past reminders

          qualifyingIds.add(attempt.attemptId);
          const existing = tracked[attempt.attemptId];
          const expectedIso = reminderDate.toISOString();

          if (existing && existing.scheduledFor === expectedIso) {
            continue; // Already scheduled correctly
          }

          // Cancel old notification if rescheduling
          if (existing) {
            try {
              await Notifications.cancelScheduledNotificationAsync(existing.notificationId);
            } catch {
              // Already cancelled
            }
          }

          // Compute days until bake for the notification body
          const bakeDate = new Date(attempt.date);
          const daysUntil = Math.ceil((bakeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Shopping reminder',
              body: `Your bake "${attempt.name}" is in ${daysUntil} day${daysUntil === 1 ? '' : 's'} — check your shopping list!`,
              data: { type: 'shopping_reminder', attemptId: attempt.attemptId },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: reminderDate,
            },
          });

          tracked[attempt.attemptId] = { notificationId, scheduledFor: expectedIso };
        }

        // Cancel orphaned notifications (attempts that no longer qualify)
        for (const attemptId of Object.keys(tracked)) {
          if (!qualifyingIds.has(attemptId)) {
            try {
              await Notifications.cancelScheduledNotificationAsync(tracked[attemptId].notificationId);
            } catch {
              // Already cancelled
            }
            delete tracked[attemptId];
          }
        }

        await saveTracked(tracked);
      } finally {
        isReconciling.current = false;
      }
    };

    reconcile();
  }, [attemptsData, shoppingReminderEnabled, shoppingReminderDaysBefore]);
}
