import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Icon, Loading } from '../components/common';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../theme';
import { usePreferences } from '../contexts/PreferencesContext';

export default function PreferencesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { preferences, isLoading, isUpdating, updatePreferences, temperatureUnit } = usePreferences();

  const [selectedTempUnit, setSelectedTempUnit] = useState<'F' | 'C'>(temperatureUnit);

  // Sync local state when preferences load
  useEffect(() => {
    if (preferences) {
      setSelectedTempUnit(preferences.temperatureUnit);
    }
  }, [preferences]);

  const handleTempUnitChange = async (unit: 'F' | 'C') => {
    if (unit === selectedTempUnit) return;

    setSelectedTempUnit(unit);
    try {
      await updatePreferences({ temperatureUnit: unit });
    } catch (error) {
      // Revert on error
      setSelectedTempUnit(selectedTempUnit);
      console.error('Failed to update temperature unit:', error);
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
          <Text style={styles.title}>Preferences</Text>
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
        <Text style={styles.title}>Preferences</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing[6] }}
      >
        {/* Temperature Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TEMPERATURE</Text>
          <View style={styles.card}>
            <Text style={styles.settingLabel}>Default temperature unit</Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segment,
                  selectedTempUnit === 'F' && styles.segmentActive,
                ]}
                onPress={() => handleTempUnitChange('F')}
                disabled={isUpdating}
              >
                <Text
                  style={[
                    styles.segmentText,
                    selectedTempUnit === 'F' && styles.segmentTextActive,
                  ]}
                >
                  Fahrenheit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segment,
                  selectedTempUnit === 'C' && styles.segmentActive,
                ]}
                onPress={() => handleTempUnitChange('C')}
                disabled={isUpdating}
              >
                <Text
                  style={[
                    styles.segmentText,
                    selectedTempUnit === 'C' && styles.segmentTextActive,
                  ]}
                >
                  Celsius
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.settingHint}>
              This will be the default when creating new recipes and variants.
            </Text>
          </View>
        </View>

        {/* Future sections placeholder */}
        {/*
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MEASUREMENTS</Text>
          <View style={styles.card}>
            <Text style={styles.settingLabel}>Measurement system</Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity style={[styles.segment, styles.segmentActive]}>
                <Text style={[styles.segmentText, styles.segmentTextActive]}>Imperial</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.segment}>
                <Text style={styles.segmentText}>Metric</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        */}
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
});
