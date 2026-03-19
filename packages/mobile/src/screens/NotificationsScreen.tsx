import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Icon, Loading } from '../components/common';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../theme';
import { usePreferences } from '../contexts/PreferencesContext';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { preferences, isLoading, isUpdating, updatePreferences, shoppingReminderEnabled, shoppingReminderDaysBefore } = usePreferences();

  const [reminderEnabled, setReminderEnabled] = useState(shoppingReminderEnabled);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(shoppingReminderDaysBefore);

  // Sync local state when preferences load
  useEffect(() => {
    if (preferences) {
      setReminderEnabled(preferences.shoppingReminderEnabled ?? true);
      setReminderDaysBefore(preferences.shoppingReminderDaysBefore ?? 2);
    }
  }, [preferences]);

  const handleReminderToggle = async (enabled: boolean) => {
    setReminderEnabled(enabled);
    try {
      await updatePreferences({ shoppingReminderEnabled: enabled });
    } catch (error) {
      setReminderEnabled(reminderEnabled);
      console.error('Failed to update reminder setting:', error);
    }
  };

  const handleReminderDaysChange = async (days: number) => {
    if (days === reminderDaysBefore) return;

    setReminderDaysBefore(days);
    try {
      await updatePreferences({ shoppingReminderDaysBefore: days });
    } catch (error) {
      setReminderDaysBefore(reminderDaysBefore);
      console.error('Failed to update reminder days:', error);
    }
  };

  if (isLoading && !preferences) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow_back" size="md" color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>
        <Loading message="Loading preferences..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow_back" size="md" color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing[6] }}
      >
        {/* Shopping Reminders Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SHOPPING</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.settingLabel}>Shopping list reminders</Text>
                <Text style={styles.settingHint}>
                  Get reminded to shop before upcoming bakes
                </Text>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={handleReminderToggle}
                trackColor={{ false: colors.bgLight, true: colors.primary }}
                disabled={isUpdating}
              />
            </View>

            {reminderEnabled && (
              <View style={styles.reminderDays}>
                <Text style={styles.settingLabel}>Remind me</Text>
                <View style={styles.segmentedControl}>
                  {[1, 2, 3].map(days => (
                    <TouchableOpacity
                      key={days}
                      style={[
                        styles.segment,
                        reminderDaysBefore === days && styles.segmentActive,
                      ]}
                      onPress={() => handleReminderDaysChange(days)}
                      disabled={isUpdating}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          reminderDaysBefore === days && styles.segmentTextActive,
                        ]}
                      >
                        {days} day{days !== 1 ? 's' : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.settingHint}>
                  How many days before the bake
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  backButton: {
    padding: spacing[2],
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    letterSpacing: 1.5,
    color: colors.dustyMauve,
    marginBottom: spacing[3],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
  },
  settingLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.text,
    marginBottom: spacing[3],
  },
  settingHint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    marginTop: spacing[3],
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.lg,
    padding: spacing[1],
  },
  segment: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  segmentActive: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
  segmentTextActive: {
    color: colors.primary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    flex: 1,
    marginRight: spacing[3],
  },
  reminderDays: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
});
